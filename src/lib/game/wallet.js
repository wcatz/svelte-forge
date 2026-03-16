const POOL_ID = 'pool1eqj3dzpkcklc2r0v8pt8adrhrshq8m4zsev072ga7a52uj5wv5c';

export function detectWallets() {
	if (typeof window === 'undefined' || !window.cardano) return [];
	return Object.keys(window.cardano)
		.filter(key => {
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
	const stakeAddress = hexToBech32(rewardAddresses[0], 'stake');
	// stake address logged only in dev — removed for security

	// Check delegation + handle via server-side Koios call
	const res = await fetch('/api/game/check-wallet', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ stakeAddress, turnstileToken }),
	});

	if (!res.ok) {
		throw new Error('Wallet check failed');
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
