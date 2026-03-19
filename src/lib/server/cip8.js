/**
 * CIP-8 message signing verification for Cardano CIP-30 wallets.
 *
 * Verifies that a CIP-30 signData() response was produced by the holder
 * of a given stake address, using:
 *   - Minimal CBOR decoding (no external CBOR library)
 *   - Node.js built-in Ed25519 verification
 *   - blakejs for Blake2b-224 key hashing
 */
import { verify, createPublicKey } from 'node:crypto';
import { blake2b } from 'blakejs';

// ── Minimal CBOR decoder ──────────────────────────────────────────────
// Handles only the subset needed for COSESign1 and COSEKey:
//   major 0: unsigned int
//   major 1: negative int
//   major 2: byte string
//   major 3: text string
//   major 4: array
//   major 5: map
//   major 6: tag (we unwrap and return the inner value)
//   major 7: simple values (true/false/null)

/**
 * Decode one CBOR item from buf starting at offset.
 * Returns { value, offset } where offset is the position after the item.
 */
function decodeCbor(buf, offset = 0) {
	if (offset >= buf.length) throw new Error('CBOR: unexpected end of input');

	const initial = buf[offset];
	const major = initial >> 5;
	const additional = initial & 0x1f;
	offset += 1;

	// Read the argument value
	let arg;
	if (additional < 24) {
		arg = additional;
	} else if (additional === 24) {
		arg = buf[offset];
		offset += 1;
	} else if (additional === 25) {
		arg = buf.readUInt16BE(offset);
		offset += 2;
	} else if (additional === 26) {
		arg = buf.readUInt32BE(offset);
		offset += 4;
	} else if (additional === 27) {
		// 8-byte integer — we only need values that fit in Number.MAX_SAFE_INTEGER
		const hi = buf.readUInt32BE(offset);
		const lo = buf.readUInt32BE(offset + 4);
		arg = hi * 0x100000000 + lo;
		offset += 8;
	} else if (additional === 31 && (major === 2 || major === 3)) {
		// Indefinite-length byte/text string — not expected from wallets but handle gracefully
		throw new Error('CBOR: indefinite-length strings not supported');
	} else if (additional === 31 && (major === 4 || major === 5)) {
		// Indefinite-length array/map
		const items = [];
		while (buf[offset] !== 0xff) {
			const item = decodeCbor(buf, offset);
			items.push(item.value);
			offset = item.offset;
		}
		offset += 1; // skip break byte
		if (major === 5) {
			const map = new Map();
			for (let i = 0; i < items.length; i += 2) {
				map.set(items[i], items[i + 1]);
			}
			return { value: map, offset };
		}
		return { value: items, offset };
	} else {
		throw new Error(`CBOR: unsupported additional info ${additional} for major ${major}`);
	}

	switch (major) {
		case 0: // unsigned integer
			return { value: arg, offset };
		case 1: // negative integer
			return { value: -1 - arg, offset };
		case 2: { // byte string
			const bytes = Buffer.from(buf.subarray(offset, offset + arg));
			offset += arg;
			return { value: bytes, offset };
		}
		case 3: { // text string
			const text = buf.subarray(offset, offset + arg).toString('utf8');
			offset += arg;
			return { value: text, offset };
		}
		case 4: { // array
			const arr = [];
			for (let i = 0; i < arg; i++) {
				const item = decodeCbor(buf, offset);
				arr.push(item.value);
				offset = item.offset;
			}
			return { value: arr, offset };
		}
		case 5: { // map
			const map = new Map();
			for (let i = 0; i < arg; i++) {
				const key = decodeCbor(buf, offset);
				offset = key.offset;
				const val = decodeCbor(buf, offset);
				offset = val.offset;
				map.set(key.value, val.value);
			}
			return { value: map, offset };
		}
		case 6: { // tag — unwrap and return inner value
			const inner = decodeCbor(buf, offset);
			return { value: inner.value, offset: inner.offset };
		}
		case 7: { // simple values
			if (arg === 20) return { value: false, offset };
			if (arg === 21) return { value: true, offset };
			if (arg === 22) return { value: null, offset };
			return { value: undefined, offset };
		}
		default:
			throw new Error(`CBOR: unknown major type ${major}`);
	}
}

/**
 * Decode a hex-encoded CBOR buffer into a JS value.
 */
function cborDecodeHex(hex) {
	const buf = Buffer.from(hex, 'hex');
	return decodeCbor(buf, 0).value;
}

// ── Ed25519 helpers ───────────────────────────────────────────────────

// DER prefix for Ed25519 SubjectPublicKeyInfo (12 bytes before the 32-byte key)
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

/**
 * Import a raw 32-byte Ed25519 public key into a Node.js KeyObject.
 */
function importEd25519PublicKey(rawPubKey) {
	const der = Buffer.concat([ED25519_SPKI_PREFIX, rawPubKey]);
	return createPublicKey({ key: der, format: 'der', type: 'spki' });
}

/**
 * Verify an Ed25519 signature using Node.js built-in crypto.
 */
function verifyEd25519(publicKeyObj, message, signature) {
	return verify(null, message, publicKeyObj, signature);
}

// ── CBOR encoding helper (minimal, for Sig_structure) ─────────────────

/**
 * Encode a value as CBOR bytes. Only supports the types needed for Sig_structure:
 *   - string (text string)
 *   - Buffer (byte string)
 *   - Array (CBOR array)
 */
function cborEncode(value) {
	if (typeof value === 'string') {
		const strBuf = Buffer.from(value, 'utf8');
		return Buffer.concat([encodeCborHead(3, strBuf.length), strBuf]);
	}
	if (Buffer.isBuffer(value)) {
		return Buffer.concat([encodeCborHead(2, value.length), value]);
	}
	if (Array.isArray(value)) {
		const head = encodeCborHead(4, value.length);
		const items = value.map(cborEncode);
		return Buffer.concat([head, ...items]);
	}
	throw new Error('cborEncode: unsupported type ' + typeof value);
}

function encodeCborHead(major, length) {
	const majorShifted = major << 5;
	if (length < 24) {
		return Buffer.from([majorShifted | length]);
	} else if (length < 256) {
		return Buffer.from([majorShifted | 24, length]);
	} else if (length < 65536) {
		const buf = Buffer.alloc(3);
		buf[0] = majorShifted | 25;
		buf.writeUInt16BE(length, 1);
		return buf;
	} else {
		const buf = Buffer.alloc(5);
		buf[0] = majorShifted | 26;
		buf.writeUInt32BE(length, 1);
		return buf;
	}
}

// ── CIP-8 verification ───────────────────────────────────────────────

/**
 * Verify a CIP-8/CIP-30 signData response.
 *
 * @param {string} signatureHex  - Hex-encoded CBOR COSESign1 from signData().signature
 * @param {string} keyHex        - Hex-encoded CBOR COSEKey from signData().key
 * @param {string} nonce         - The nonce that was signed (hex string)
 * @param {string} stakeAddrHex  - The hex-encoded stake address (from getRewardAddresses)
 * @returns {{ valid: boolean, error?: string }}
 */
export function verifyCip8Signature(signatureHex, keyHex, nonce, stakeAddrHex) {
	try {
		// 1. Decode COSEKey to extract the Ed25519 public key
		const coseKey = cborDecodeHex(keyHex);
		if (!(coseKey instanceof Map)) {
			return { valid: false, error: 'COSEKey is not a CBOR map' };
		}

		// COSEKey label -2 = x coordinate (the 32-byte Ed25519 public key)
		const rawPubKey = coseKey.get(-2);
		if (!Buffer.isBuffer(rawPubKey) || rawPubKey.length !== 32) {
			return { valid: false, error: 'COSEKey missing Ed25519 public key (label -2)' };
		}

		// 2. Verify the public key hashes to the stake address
		// Stake address format: 1 byte header + 28 bytes key hash
		const stakeAddrBytes = Buffer.from(stakeAddrHex, 'hex');
		if (stakeAddrBytes.length !== 29) {
			return { valid: false, error: 'Invalid stake address length' };
		}

		const keyHash = Buffer.from(blake2b(rawPubKey, null, 28)); // blake2b-224
		const addrKeyHash = stakeAddrBytes.subarray(1); // bytes 1-28

		if (!keyHash.equals(addrKeyHash)) {
			return { valid: false, error: 'Public key does not match stake address' };
		}

		// 3. Decode COSESign1 structure
		const coseSign1 = cborDecodeHex(signatureHex);
		if (!Array.isArray(coseSign1) || coseSign1.length !== 4) {
			return { valid: false, error: 'COSESign1 is not a 4-element array' };
		}

		const [protectedHeaders, , payload, sig] = coseSign1;

		if (!Buffer.isBuffer(protectedHeaders)) {
			return { valid: false, error: 'COSESign1 protected headers is not a byte string' };
		}
		if (!Buffer.isBuffer(sig)) {
			return { valid: false, error: 'COSESign1 signature is not a byte string' };
		}

		// 4. Verify the payload contains our nonce
		// The payload is the signed message — "Star Forger CIP8 Session Protection Nonce: <hex>"
		const expectedPayload = Buffer.from(`Star Forger CIP8 Session Protection Nonce: ${nonce}`);
		if (Buffer.isBuffer(payload)) {
			if (!payload.equals(expectedPayload)) {
				return { valid: false, error: 'Signed payload does not match nonce' };
			}
		} else if (payload === null) {
			// Some wallets put payload as null in COSESign1 and embed it in protected headers
			// We'll check this during signature verification
		} else {
			return { valid: false, error: 'Unexpected payload type in COSESign1' };
		}

		// 5. Build the Sig_structure that was actually signed
		// Sig_structure = ["Signature1", protectedHeaders, externalAad, payload]
		// externalAad is empty byte string
		const payloadForSig = Buffer.isBuffer(payload) ? payload : expectedPayload;
		const sigStructure = cborEncode([
			'Signature1',
			protectedHeaders,
			Buffer.alloc(0), // external_aad
			payloadForSig,
		]);

		// 6. Verify the Ed25519 signature
		const pubKeyObj = importEd25519PublicKey(rawPubKey);
		const isValid = verifyEd25519(pubKeyObj, sigStructure, sig);

		if (!isValid) {
			return { valid: false, error: 'Ed25519 signature verification failed' };
		}

		return { valid: true };
	} catch (e) {
		return { valid: false, error: `CIP-8 verification error: ${e.message}` };
	}
}
