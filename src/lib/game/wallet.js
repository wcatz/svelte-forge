/** Truncate a bech32 stake address to `stake1xxxx...yyyy` */
export function truncateStakeAddr(addr) {
	if (!addr || addr.length < 14) return addr || '???';
	return addr.slice(0, 10) + '...' + addr.slice(-4);
}

export function detectWallets() {
	if (typeof window === 'undefined' || !window.cardano) return [];
	const BLOCKED_WALLETS = new Set(['brave']);
	return Object.keys(window.cardano)
		.filter(key => {
			if (BLOCKED_WALLETS.has(key.toLowerCase())) return false;
			const w = window.cardano[key];
			return w && typeof w === 'object' && typeof w.enable === 'function' && typeof w.icon === 'string';
		})
		.map(key => ({
			id: key,
			name: window.cardano[key].name || key,
			icon: window.cardano[key].icon,
		}));
}

export async function connectWallet(walletId, turnstileToken = '') {
	const connector = window.cardano?.[walletId];
	if (!connector) throw new Error('Wallet not found');

	const api = await connector.enable();

	const networkId = await api.getNetworkId();
	if (networkId !== 1) throw new Error('Switch wallet to mainnet');

	// Get stake address from CIP-30 API (hex → bech32)
	const rewardAddresses = await api.getRewardAddresses();
	if (!rewardAddresses || rewardAddresses.length === 0) {
		throw new Error('No staking address found');
	}
	const stakeAddressHex = rewardAddresses[0];
	const stakeAddress = hexToBech32(stakeAddressHex, 'stake');

	// ── CIP-8 message signing: prove wallet ownership ─────────────
	// 1. Request a nonce from the server
	const nonceRes = await fetch('/api/game/auth-nonce', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ stakeAddress }),
	});
	if (!nonceRes.ok) {
		const err = await nonceRes.json().catch(() => ({}));
		throw new Error(err.error || 'Failed to get auth nonce');
	}
	const { nonce } = await nonceRes.json();

	// 2. Sign the nonce with the wallet (triggers signing popup)
	// Encode a human-readable message as hex so the wallet displays it as text
	const message = `Star Forger OTG CIP8 nonce: ${nonce}`;
	let payloadHex = '';
	for (let i = 0; i < message.length; i++) {
		payloadHex += message.charCodeAt(i).toString(16).padStart(2, '0');
	}
	let signResult;
	try {
		signResult = await api.signData(stakeAddressHex, payloadHex);
	} catch (e) {
		// User declined the signing request (code 2) or other wallet error
		if (e?.code === 2) throw new Error('Signing declined');
		throw new Error(e?.message || 'Wallet signing failed');
	}

	// 3. Send signature + key + nonce to check-wallet for verification
	const res = await fetch('/api/game/check-wallet', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			stakeAddress,
			stakeAddressHex,
			turnstileToken,
			signature: signResult.signature,
			key: signResult.key,
			nonce,
		}),
	});

	if (!res.ok) {
		const errBody = await res.json().catch(() => ({}));
		throw new Error(errBody.error || 'Wallet check failed');
	}

	const check = await res.json();
	// check result logged only in dev — removed for security

	return {
		api,
		stakeAddress,
		delegatedPool: check.delegatedPool,
		isDelegated: check.isDelegated,
		accessGranted: check.accessGranted,
		delegationError: check.delegationError,
		adaHandle: check.adaHandle,
		sessionToken: check.sessionToken,
		walletName: connector.name || walletId,
	};
}

export async function submitScore(sessionToken, displayName, score, blocksForged, nightEarned) {
	try {
		const res = await fetch('/api/game/leaderboard', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ sessionToken, displayName, score, blocksForged, nightEarned }),
		});
		if (res.ok) return res.json();
	} catch {}
	return null;
}

export async function fetchLeaderboard() {
	try {
		const res = await fetch('/api/game/leaderboard');
		if (res.ok) return res.json();
	} catch {}
	return [];
}

// === Bech32 encoding (minimal, no external deps) ===

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function bech32Polymod(values) {
	const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
	let chk = 1;
	for (const v of values) {
		const b = chk >> 25;
		chk = ((chk & 0x1ffffff) << 5) ^ v;
		for (let i = 0; i < 5; i++) {
			chk ^= ((b >> i) & 1) ? GEN[i] : 0;
		}
	}
	return chk;
}

function bech32HrpExpand(hrp) {
	const ret = [];
	for (const c of hrp) ret.push(c.charCodeAt(0) >> 5);
	ret.push(0);
	for (const c of hrp) ret.push(c.charCodeAt(0) & 31);
	return ret;
}

function bech32Checksum(hrp, data) {
	const values = [...bech32HrpExpand(hrp), ...data, 0, 0, 0, 0, 0, 0];
	const polymod = bech32Polymod(values) ^ 1;
	return Array.from({ length: 6 }, (_, i) => (polymod >> (5 * (5 - i))) & 31);
}

function bech32Encode(hrp, data) {
	const combined = [...data, ...bech32Checksum(hrp, data)];
	return hrp + '1' + combined.map(d => BECH32_CHARSET[d]).join('');
}

function convertBits(data, fromBits, toBits) {
	let acc = 0;
	let bits = 0;
	const ret = [];
	const maxv = (1 << toBits) - 1;
	for (const value of data) {
		acc = (acc << fromBits) | value;
		bits += fromBits;
		while (bits >= toBits) {
			bits -= toBits;
			ret.push((acc >> bits) & maxv);
		}
	}
	if (bits > 0) ret.push((acc << (toBits - bits)) & maxv);
	return ret;
}

function hexToBech32(hex, hrp) {
	const bytes = hex.match(/.{1,2}/g).map(b => parseInt(b, 16));
	const words = convertBits(bytes, 8, 5);
	return bech32Encode(hrp, words);
}
