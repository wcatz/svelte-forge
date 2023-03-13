import { Blockfrost, Lucid } from 'lucid-cardano';

/**
 * Transaction check interval in milliseconds
 */
const CHECK_INTERVAL = 10000;
const PROVIDER_URL = 'https://cardano-mainnet.blockfrost.io/api/v0';
const API_KEY = 'mainnetqh3YFo6lYYWulDptpTDeYuTVMKG3ZdH6';

export default class Delegate {
	constructor(api) {
		this.api = api;
		this.signedTx = undefined;
	}

	async getLucid() {
		if (this.lucid) {
			return this.lucid;
		}
		this.lucid = await Lucid.new(new Blockfrost(PROVIDER_URL, API_KEY));
		return this.lucid;
	}

	async checkDelegation() {
		const lucid = await this.getLucid();
		lucid.selectWallet(this.api);
		const rewardAddress = await this.lucid.wallet.rewardAddress();
		const currentDelegation = await lucid.delegationAt(rewardAddress);
		return currentDelegation.poolId;
	}

	async delegate(poolId) {
		const lucid = await this.getLucid();
		lucid.selectWallet(this.api);

		// Valid 1 hours
		const validUntil = new Date();
		validUntil.setHours(validUntil.getHours() + 1);

		const rewardAddress = await this.lucid.wallet.rewardAddress();

		let registered = false;

		const accountInfo = await this.request(PROVIDER_URL, `/accounts/${rewardAddress}`, {
			project_id: API_KEY
		});

		if (accountInfo && accountInfo.active) {
			registered = true;
		}

		let tx = await lucid.newTx();

		if (!registered) {
			tx.registerStake(rewardAddress);
		}

		tx = await tx.delegateTo(rewardAddress, poolId).validTo(validUntil.valueOf()).complete();

		this.signedTx = await tx.sign().complete();

		return this.signedTx.submit();
	}

	getTxHash() {
		return this.signedTx ? this.signedTx.toHash() : undefined;
	}

	async awaitTx() {
		if (!this.signedTx) {
			return false;
		}
		const lucid = await this.getLucid();
		return lucid.awaitTx(this.getTxHash(), CHECK_INTERVAL);
	}

	async request(providerUrl, endpoint, headers, body) {
		return fetch(providerUrl + endpoint, {
			headers: {
				...headers,
				'User-Agent': 'OTG'
			},
			method: body ? 'POST' : 'GET',
			body
		})
			.then((res) => {
				if (res.ok) {
					return res.json();
				} else {
					console.error(res.status, res.url, res.statusText);
					return null;
				}
			})
			.catch(console.error);
	}
}
