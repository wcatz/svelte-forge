<svelte:head>
	<title>Star Forge Cardano Stake Pool</title>
	<meta name="description" content="Best Cardano ADA Stake Pool to earn passive income and support a decentralized blockchain."/>
</svelte:head>

<script>
	import { base } from '$app/paths';
	import Typewriter from 'svelte-typewriter';

	const numberFormatter = Intl.NumberFormat('en-US');

	let getPoolHistory = (async () => {
		const res = await fetch(
			'https://koios.tosidrop.io/api/v0/pool_history?_pool_bech32=pool1eqj3dzpkcklc2r0v8pt8adrhrshq8m4zsev072ga7a52uj5wv5c&limit=6'
		);
		return await res.json();
	})();

	let getPoolInfo = (async () => {
		const res = await fetch('https://koios.tosidrop.io/api/v0/pool_info', {
			method: 'post',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				_pool_bech32_ids: ['pool1eqj3dzpkcklc2r0v8pt8adrhrshq8m4zsev072ga7a52uj5wv5c']
			})
		});
		//		console.log(res);

		return await res.json();
	})();

	function handleClick() {}

	// delegate Nami
	function handleDelegate() {
		var pool_id = 'c825168836c5bf850dec38567eb4771c2e03eea28658ff291df768ae';
		var blockfrost_project_id = 'mainnet5KZZo60WRq8nMsRWNvrvPqyrHtqucJlM';
		var link =
			'https://armada-alliance.com/delegation-widget?pool_id=' +
			pool_id +
			'&blockfrost_project_id=' +
			blockfrost_project_id;
		var width = 600;
		var height = Math.min(800, parseInt(window.outerHeight, 10));
		var left = parseInt(window.outerWidth, 10) / 2 - width / 2;
		var top = (parseInt(window.outerHeight, 10) - height) / 2;
		window.open(
			link,
			'Delegate',
			'width=' +
				width +
				',height=' +
				height +
				',toolbar=0,menubar=0,location=0,status=0,scrollbars=1,resizable=1,left=' +
				left +
				',top=' +
				top
		);
	}
</script>


<div class="">
	<div class="absolute inset-x-10 top-56 grid grid-cols-8 gap-1 z-30">
		<div class="hidden lg:block col-start-1 col-span-1" />
		<div class="col-start-2 col-span-6 place-self-center">
			<Typewriter cursor={false} mode="loopOnce" interval="150" delay="400" wordInterval="1250">
				<h1 class="text-2xl">Welcome traveler!</h1>
				<h1 class="text-2xl">Forge authenticated.</h1>
				<h1 class="text-2xl">All systems nominal.</h1>
				<h1 class="text-2xl">Have a nice day.</h1>
			</Typewriter>
		</div>
		<div class="hidden lg:block col-end-9 col-span-1 place-self-end">
			<video class="rounded-t-full opacity-50" width="170" autoPlay muted playsInline loop>
				<source src="{base}/assets/videos/Tosi_Matrix.webm" type="video/webm" />
				<source src="{base}/assets/videos/Tosi_Matrix.mp4" type="video/mp4" />
			</video>
		</div>
	</div>
</div>

<div
	class="starscreen relative overflow-hidden rounded-b-[100px] border-b-4 border-accent bg-cover bg-center md:rounded-b-[200px]"
	style:background-image={`url(../assets/images/stake-pool-hero.webp)`}
>
	<div class="absolute -bottom-2 z-30 left-1/2 transform -translate-x-1/2">
		<div class="hidden lg:block">
			{#await getPoolInfo}
				<div class="flex justify-center items-center mb-10">
					<div
						class="
				  animate-spin
				  rounded-full
				  h-10
				  w-10
				  border-t-2 border-b-2 border-indigo-500
				  "
					/>
				</div>
			{:then data}
				<div class="flex justify-center text-center">
					<dl
						class="flex flex-cols-1 gap-2 sm:flex-cols-7 bg-secondary bg-opacity-50 mb-1 border-opacity-70 border-t-2 border-l-2 border-r-2 border-accent rounded-t-lg"
					>
						<div class="px-4 py-5 sm:p-6">
							<dt class="text-sm font-medium truncate">Blocks</dt>
							<dd class="mt-1 text-3xl font-semibold 0">
								{data[0].block_count}
							</dd>
							<div class="stat-desc text-green-400" />
						</div>

						<div class="px-4 py-5 sm:p-6">
							<dt class="text-sm font-medium truncate">Pledge</dt>
							<dd class="mt-1 text-3xl font-semibold 0">500K</dd>
						</div>

						<div class="px-4 py-5 sm:p-6">
							<dt class="text-sm font-medium truncate">Margin</dt>
							<dd class="mt-1 text-3xl font-semibold 0">
								{data[0].margin * 100}%
							</dd>
						</div>
						<div class="px-4 py-5 sm:p-6">
							<dt class="text-sm font-medium truncate">Stake</dt>
							<dd class="mt-1 text-3xl font-semibold 0">
								{(data[0].live_stake / 1000000000000).toFixed(2)}M
							</dd>
						</div>
						<div class="px-4 py-5 sm:p-6">
							<dt class="text-sm font-medium truncate">Delegators</dt>
							<dd class="mt-1 text-3xl font-semibold 0">
								{data[0].live_delegators}
							</dd>
						</div>
						<div class="px-4 py-5 sm:p-6">
							<dt class="text-sm font-medium truncate">Saturation</dt>
							<dd class="mt-1 text-3xl font-semibold 0">
								{data[0].live_saturation}%
							</dd>
						</div>
					</dl>
				</div>
			{:catch error}
				<p>Koios API error</p>
			{/await}
		</div>
	</div>
</div>

<div class="overflow-hidden">
	<div class="relative py-2 sm:py-3 lg:py-4">
		<div class="mx-auto max-w-md px-4 text-center sm:max-w-3xl sm:px-6 lg:max-w-7xl lg:px-8">
			<div class="hidden md:block" />

			<h1 class="mt-5 bg-clip-text text-4xl font-extrabold uppercase tracking-wider lg:text-5xl">
				🌟
				<span
					class="mt-5 bg-gradient-to-r from-accent to-teal-500 bg-clip-text text-4xl font-extrabold uppercase tracking-wider text-transparent lg:text-5xl"
				>
					Star Forge
				</span>
				⚡
			</h1>
			<img
				class="h-28 w-28 m-auto my-8"
				src="{base}/assets/images/Star-Forge-Logo-06.svg"
				alt="Cardano Stake Pool Star Forge"
			/>
			<p
				class="mt-2 bg-gradient-to-r from-accent to-teal-500 bg-clip-text text-3xl font-semibold tracking-wider text-transparent lg:text-4xl"
			>
				Cardano Stake Pool
			</p>
			<p class="mt-2 text-xl font-semibold tracking-tight">Ticker = OTG</p>
			<span
				class="relative z-0 m-5 inline-grid grid-cols-2 justify-center gap-4 md:grid-cols-6 md:gap-0"
			>
				<button
					on:click={handleDelegate}
					class="btn-ghost relative -ml-px inline-flex items-center justify-center rounded-md border border-accent px-4 py-2 text-sm font-medium hover:border-accent focus:z-10 focus:outline-none focus:ring-1 md:rounded-none md:rounded-l-md"
					type="button"
				>
					Delegate
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="ml-1 h-6 w-6 animate-pulse text-red-500"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
						/>
					</svg>
				</button>
				<button
					on:click={() => handleClick((location.href = 'https://tosidrop.io/'))}
					rel="nofollow"
					href="https://tosidrop.io/"
					tabIndex="0"
					type="button"
					class="btn-ghost relative -ml-px items-center justify-center rounded-md border border-accent px-4 py-2 text-sm font-medium hover:border-accent focus:z-10 focus:outline-none focus:ring-1 md:rounded-none"
				>
					Tosidrop ☔
				</button>
				<button
					on:click={() =>
						handleClick(
							(location.href =
								'https://pool.pm/c825168836c5bf850dec38567eb4771c2e03eea28658ff291df768ae')
						)}
					rel="nofollow"
					type="button"
					href="https://pool.pm/c825168836c5bf850dec38567eb4771c2e03eea28658ff291df768ae"
					class="btn-ghost relative -ml-px items-center justify-center rounded-md border border-accent px-4 py-2 text-sm font-medium hover:border-accent focus:z-10 focus:outline-none focus:ring-1 md:rounded-none"
				>
					PoolPM 🐉
				</button>
				<button
					on:click={() =>
						handleClick(
							(location.href =
								'https://cardanoscan.io/pool/c825168836c5bf850dec38567eb4771c2e03eea28658ff291df768ae')
						)}
					rel="nofollow"
					href="https://cardanoscan.io/pool/c825168836c5bf850dec38567eb4771c2e03eea28658ff291df768ae"
					type="button"
					class="btn-ghost relative -ml-px items-center justify-center rounded-md border border-accent px-4 py-2 text-sm font-medium hover:border-accent focus:z-10 focus:outline-none focus:ring-1 md:rounded-none"
				>
					Cardanoscan 🔬
				</button>
				<button
					on:click={() =>
						handleClick(
							(location.href =
								'https://pooltool.io/pool/c825168836c5bf850dec38567eb4771c2e03eea28658ff291df768ae')
						)}
					rel="nofollow"
					href="https://pooltool.io/pool/c825168836c5bf850dec38567eb4771c2e03eea28658ff291df768ae"
					type="button"
					class="btn-ghost relative -ml-px items-center justify-center rounded-md border border-accent px-4 py-2 text-sm font-medium hover:border-accent focus:z-10 focus:outline-none focus:ring-1 md:rounded-none"
				>
					PoolTool 🎱
				</button>
				<button
					on:click={() =>
						handleClick(
							(location.href =
								'https://cexplorer.io/pool/pool1eqj3dzpkcklc2r0v8pt8adrhrshq8m4zsev072ga7a52uj5wv5c')
						)}
					rel="nofollow"
					href="https://cexplorer.io/pool/pool1eqj3dzpkcklc2r0v8pt8adrhrshq8m4zsev072ga7a52uj5wv5c"
					type="button"
					class="btn-ghost relative -ml-px items-center justify-center rounded-md border border-accent px-4 py-2 text-sm font-medium hover:border-accent focus:z-10 focus:outline-none focus:ring-1 md:rounded-none md:rounded-r-md"
				>
					Cexplorer 🔍
				</button>
			</span>

			<p class="container-fluid mx-auto mb-10 mt-5 max-w-prose text-xl">
				The Star Forge is a fully ARM'ed solar powered Starlink connected Off The Grid Cardano Stake
				Pool with 2 weeks of LiFePo4 battery storage.
			</p>
		</div>
	</div>
	<div>
		<div class="relative pb-2 sm:pb-4 lg:pb-8">
			<div class="mx-auto max-w-md px-4 text-center sm:max-w-3xl sm:px-6 lg:max-w-7xl lg:px-8">
				<div class="items-center justify-center" />
				<div class="flex items-center">
					<div class="flex-auto">
						<h1
							class="mt-6 leading-8 font-extrabold tracking-tight font- text-4xl bg-clip-text text-transparent bg-gradient-to-r from-accent to-teal-500"
						>
							Latest Pool Stats
						</h1>

						<p class="my-5">Information about pools performance/rewards for the last 5 payouts</p>
					</div>
				</div>
				<div class="mb-8 overflow-auto rounded-lg border-2 border-accent">
					<table class="table-zebra table w-full">
						<thead class="">
							<tr>
								<th class="hidden" />
								<th>EPOCH</th>
								<th>ACTIVE STAKE</th>
								<th>BLOCKS</th>
								<th>DELEGATE PAYOUT</th>
								<th>EPOCH RO₳</th>
								<th>OPERATOR FEE</th>
							</tr>
						</thead>
						<tbody>
							{#await getPoolHistory}
								<div class="flex justify-center items-center mb-10">
									<div
										class="
										  animate-spin
										  rounded-full
										  h-10
										  w-10
										  border-t-2 border-b-2 border-indigo-500
										  "
									/>
								</div>
							{:then data}
								{#each data.slice(1) as val}
									<tr class="hover">
										<td class="sm:pl-6">{val.epoch_no}</td>
										<td class="">
											{(val.active_stake / 1000000000000).toFixed(2)} M
										</td>
										<td class="">{val.block_cnt}</td>
										<td class="">
											{numberFormatter.format((val.deleg_rewards / 100000).toFixed(0))} ₳
										</td>
										<td class="">
											{val.epoch_ros.toFixed(2)} %
										</td>
										<td class="">
											{(val.pool_fees / 1000000).toFixed(0)} ₳
										</td>
									</tr>
								{/each}
							{:catch error}
								<p>An error occurred!</p>
							{/await}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</div>
	<h1
		class="relative container text-center py-6 mb-12 leading-8 font-extrabold tracking-tight text-4xl bg-clip-text text-transparent bg-gradient-to-r from-accent to-teal-500"
	>
		<img
			class="md:relative lg:absolute -top-10 md:-top-10 lg:pl-24 h-28 m-auto my-8"
			src="{base}/assets/images/tokens/MGTRN.gif"
			alt="Cardano Stake Pool Star Forge"
		/> Star Forge Stake Pool Token Offering
	</h1>

	<div class="relative mx-auto max-w-7xl py-4 px-4 sm:px-6 lg:px-8">
		<div class="absolute top-0 bottom-0 left-3/4 hidden w-screen lg:block" />

		<div class="mt-8 lg:grid lg:grid-cols-2 lg:gap-8">
			<div class="relative lg:col-start-2 lg:row-start-1">
				<svg
					class="absolute top-2 right-2 -mt-20 -mr-20 hidden text-accent lg:block"
					width={404}
					height={384}
					fill="none"
					viewBox="0 0 404 384"
					aria-hidden="true"
				>
					<defs>
						<pattern
							id="de316486-4a29-4312-bdfc-fbce2132a2c1"
							x={0}
							y={0}
							width={20}
							height={20}
							patternUnits="userSpaceOnUse"
						>
							<rect x={0} y={0} width={4} height={4} class="" fill="currentColor" />
						</pattern>
					</defs>
					<rect width={404} height={384} fill="url(#de316486-4a29-4312-bdfc-fbce2132a2c1)" />
				</svg>
				<div class="relative mx-auto max-w-prose text-base lg:max-w-none">
					<figure>
						<div class="aspect-w-12 aspect-h-7 lg:aspect-none">
							<img
								class="rounded-lg object-cover object-center shadow-lg ring-2 ring-accent"
								src="{base}/assets/images/better-img.webp"
								alt="Cardano Stake Pool Star Forge"
								width={599}
								height={839}
							/>
						</div>
					</figure>
				</div>
			</div>
			<div class="mt-8 lg:mt-0">
				<div class="mx-auto">
					<video
						class="mb-5 rounded-xl ring-2 ring-accent"
						width="750"
						height="500"
						autoPlay
						muted
						playsInline
						loop
					>
						<source src="{base}/assets/videos/TosiDrop.webm" type="video/webm" />
						<source src="{base}/assets/videos/TosiDrop.mp4" type="video/mp4" />
					</video>
					<div>
						<div>
							<h4
								class="py-6 leading-8 font-extrabold tracking-tight font- text-4xl bg-clip-text text-transparent bg-gradient-to-r from-accent to-teal-500 text-center"
							>
								How To Claim
							</h4>
						</div>
						<div class="-mb-5 flex items-center justify-center" />
					</div>
					<p class="mx-auto mb-10 mt-8 max-w-prose text-xl">
						To be eligible to claim all you have to do is stake your ADA to the Star Forge. That's
						it, then at the beggining of every epoch go to
						<a
							rel="nofollow"
							href="https://tosidrop.io/"
							tabIndex="0"
							type="link"
							class="underline"
						>
							https://tosidrop.io
						</a>
						.
					</p>
					<section class="overflow-hidden px-4">
						<div class="flex flex-wrap -m-1 md:-m-2">
							<div class="flex flex-wrap w-1/4">
								<div class="w-full p-1 md:p-2">
									<img
										alt="Cardano World Mobile Token stake pool"
										class="block object-cover object-center w-full h-full rounded-lg"
										src="{base}/assets/images/tokens/WMT.webp"
									/>
								</div>
							</div>
							<div class="flex flex-wrap w-1/4">
								<div class="w-full p-1 md:p-2">
									<img
										alt="Cardano MELD token stake ADA"
										class="block object-cover object-center w-full h-full rounded-lg"
										src="{base}/assets/images/tokens/MELD.webp"
									/>
								</div>
							</div>
							<div class="flex flex-wrap w-1/4">
								<div class="w-full p-1 md:p-2">
									<img
										alt="Cardano EMP token Delegate"
										class="block object-cover object-center w-full h-full rounded-lg"
										src="{base}/assets/images/tokens/EMP.webp"
									/>
								</div>
							</div>
							<div class="flex flex-wrap w-1/4">
								<div class="w-full p-1 md:p-2">
									<img
										alt="Nunet NTX Cardano token"
										class="block object-cover object-center w-full h-full rounded-lg"
										src="{base}/assets/images/tokens/NXT.webp"
									/>
								</div>
							</div>

							<div class="flex flex-wrap w-1/4">
								<div class="w-full p-1 md:p-2">
									<img
										alt="PAVIA Metaverse token Cardano"
										class="block object-cover object-center w-full h-full rounded-lg"
										src="{base}/assets/images/tokens/PAVIA.webp"
									/>
								</div>
							</div>

							<div class="flex flex-wrap w-1/4">
								<div class="w-full p-1 md:p-2">
									<img
										alt="cTOSI Cardano Token claim"
										class="block object-cover object-center w-full h-full rounded-lg"
										src="{base}/assets/images/tokens/cTOSI.webp"
									/>
								</div>
							</div>
							<div class="flex flex-wrap w-1/4">
								<div class="w-full p-1 md:p-2">
									<img
										alt="CLAP Cardano native token"
										class="block object-cover object-center w-full h-full rounded-lg"
										src="{base}/assets/images/tokens/CLAP.webp"
									/>
								</div>
							</div>
							<div class="flex flex-wrap w-1/4">
								<div class="w-full p-1 md:p-2">
									<img
										alt="HOSKY token claim Cardano"
										class="block object-cover object-center w-full h-full rounded-lg"
										src="{base}/assets/images/tokens/HOSKY.webp"
									/>
								</div>
							</div>
						</div>
					</section>
				</div>
			</div>
		</div>
		<h4
			class="pt-12 pb-6 leading-8 font-extrabold tracking-tight text-4xl bg-clip-text text-transparent bg-gradient-to-r from-accent to-teal-500 text-center"
		>
			Token Offering Details
		</h4>
		<p class="mx-auto mb-10 mt-5 max-w-prose text-xl">
			Every epoch you stake with OTG you will unlock a new tier of tokens. This round is scheduled
			for 20 epochs ending on epoch 380. You must stake atleast 1,000 ADA to the pool to qualify.
			Rewards are available to claim for 3 epochs from the time they are given. For more information
			visit the Vending Machines distribution page. <a
				class="underline"
				href="http://vm.adaseal.eu/distributions">Vending Machine distributions</a
			>
		</p>
	</div>

	<div>
		<h4
			class="py-6 leading-8 font-extrabold tracking-tight text-4xl bg-clip-text text-transparent bg-gradient-to-r from-accent to-teal-500 text-center"
		>
			Reasons to Delegate ADA
		</h4>
	</div>

	<div
		class="mx-auto w-3/4 max-w-7xl py-8 px-4 sm:px-6 lg:grid lg:grid-cols-3 lg:gap-x-8 lg:py-12 lg:px-8"
	>
		<div />
		<div class="mt-12 lg:col-span-4 lg:mt-0">
			<dl
				class="space-y-10 sm:grid sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-4 sm:gap-x-6 sm:gap-y-10 sm:space-y-0 lg:gap-x-8"
			>
				<div class="relative">
					<dt>
						<!-- Heroicon name: outline/check -->
						<svg
							class="absolute h-6 w-6 text-green-500"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
						</svg>
						<p class="ml-9 text-lg font-medium leading-6">Pool Operator Alliance's</p>
					</dt>
					<dd class="mt-2 ml-9 ">
						Member of the <a class="underline" href="https://armada-alliance.com/">Armada (founding)</a>, <a class="underline" href="https://singlepoolalliance.net/">Cardano Single Pool</a> and <a class="underline" href="https://climateneutralcardano.org/">Climate Neutral Cardano</a> alliances.
					</dd>
				</div>

				<div class="relative">
					<dt>
						<!-- Heroicon name: outline/check -->
						<svg
							class="absolute h-6 w-6 text-green-500"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
						</svg>
						<p class="ml-9 text-lg font-medium leading-6">Single Stake Pool Operator</p>
					</dt>
					<dd class="mt-2 ml-9 text-base">
						A highly efficient, secure and decentralized Cardano must have single stake pool
						operations spread out around the globe.
					</dd>
				</div>

				<div class="relative">
					<dt>
						<!-- Heroicon name: outline/check -->
						<svg
							class="absolute h-6 w-6 text-green-500"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
						</svg>
						<p class="ml-9 text-lg font-medium leading-6">Solar Powered</p>
					</dt>
					<dd class="mt-2 ml-9 text-base">
						The Star Forge is designed to be completely Off The Grid, using the sun for power. 2 weeks runtime on 6 fully charged <a class="underline" href="https://www.amperetime.com/products/ampere-time-12v-300ah-lithium-lifepo4-battery">batteries</a>.
					</dd>
				</div>

				<div class="relative">
					<dt>
						<!-- Heroicon name: outline/check -->
						<svg
							class="absolute h-6 w-6 text-green-500"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
						</svg>
						<p class="ml-9 text-lg font-medium leading-6">Starlink Sattelite</p>
					</dt>
					<dd class="mt-2 ml-9 text-base">
						The Star Forge Cardano stake pool uses SpaceX Starlink sattelite & cable backup.
					</dd>
				</div>

				<div class="relative">
					<dt>
						<!-- Heroicon name: outline/check -->
						<svg
							class="absolute h-6 w-6 text-green-500"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
						</svg>
						<p class="ml-9 text-lg font-medium leading-6">Efficient ARM64 Devops</p>
					</dt>
					<dd class="mt-2 ml-9 text-base">
						CPU architecture which is much more efficient and powerfull than traditional x86 based
						processors.
					</dd>
				</div>

				<div class="relative">
					<dt>
						<!-- Heroicon name: outline/check -->
						<svg
							class="absolute h-6 w-6 text-green-500"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
						</svg>
						<p class="ml-9 text-lg font-medium leading-6">How To Guides</p>
					</dt>
					<dd class="mt-2 ml-9 text-base">
						<a class="underline" href="https://armada-alliance.com/docs/">Armada Alliance documentation</a> to help train stake pool operators and provide supprt. Always willing to teach somebody Linux.
					</dd>
				</div>

				<div class="relative">
					<dt>
						<!-- Heroicon name: outline/check -->
						<svg
							class="absolute h-6 w-6 text-green-500"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
						</svg>
						<p class="ml-9 text-lg font-medium leading-6">TosiDrop</p>
					</dt>
					<dd class="mt-2 ml-9 text-base">
						Star Forge Cardano stake pool delegates by pass the fee for claiming premium tokens. Tosidrop & Vending machine core development team member.
					</dd>
				</div>

				<div class="relative">
					<dt>
						<!-- Heroicon name: outline/check -->
						<svg
							class="absolute h-6 w-6 text-green-500"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
						</svg>
						<p class="ml-9 text-lg font-medium leading-6">Disaster preparedness</p>
					</dt>
					<dd class="mt-2 ml-9 text-base ">
						The Cardano stake pool operations have redundant power and internet supply. Fortified
						hardened and prepared. Backup hardware ready to be put into production.
					</dd>
				</div>
			</dl>
		</div>
	</div>
</div>

<style>
	.starscreen {
		height: 75vh;
	}
</style>
