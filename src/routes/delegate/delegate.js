import { Lucid, Koios } from '@lucid-evolution/lucid';

const CHECK_INTERVAL = 10000;
const KOIOS_URL = '/api/koios';

export default class Delegate {
	constructor(api) {
		this.api = api;
		this.txHash = undefined;
	}

	async getLucid() {
		if (this.lucid) {
			return this.lucid;
		}
		this.lucid = await Lucid(new Koios(KOIOS_URL), 'Mainnet');
		this.lucid.selectWallet.fromAPI(this.api);
		return this.lucid;
	}

	async checkDelegation() {
		const lucid = await this.getLucid();
		const rewardAddress = await lucid.wallet().rewardAddress();
		const delegation = await lucid.delegationAt(rewardAddress);
		return delegation.poolId;
	}

	async delegate(poolId) {
		const lucid = await this.getLucid();

		const validUntil = new Date();
		validUntil.setHours(validUntil.getHours() + 1);

		const rewardAddress = await lucid.wallet().rewardAddress();
		const delegation = await lucid.delegationAt(rewardAddress);

		let tx = lucid.newTx();

		if (!delegation.poolId) {
			tx = tx.registerStake(rewardAddress);
		}

		tx = tx.delegateTo(rewardAddress, poolId).validTo(validUntil.valueOf());

		const completed = await tx.complete();
		const signed = await completed.sign.withWallet().complete();
		this.txHash = await signed.submit();

		return this.txHash;
	}

	getTxHash() {
		return this.txHash;
	}

	async awaitTx() {
		if (!this.txHash) {
			return false;
		}
		const lucid = await this.getLucid();
		return lucid.awaitTx(this.txHash, CHECK_INTERVAL);
	}
}
