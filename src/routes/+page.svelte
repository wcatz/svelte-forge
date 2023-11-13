<script>
	import { base } from '$app/paths';
	import Typewriter from 'svelte-typewriter';

	const numberFormatter = Intl.NumberFormat('en-US');
	function handleClick() {}

	let getPoolInfo = (async () => {
		const res = await fetch('https://api.koios.rest/api/v0/pool_info', {
			method: 'post',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				_pool_bech32_ids: ['pool1eqj3dzpkcklc2r0v8pt8adrhrshq8m4zsev072ga7a52uj5wv5c']
			})
		});

		const jsonData = await res.json();
		//	console.log(jsonData);

		return jsonData;
	})();

	let getPoolHistory = (async () => {
		const res = await fetch(
			'https://api.koios.rest/api/v0/pool_history?_pool_bech32=pool1eqj3dzpkcklc2r0v8pt8adrhrshq8m4zsev072ga7a52uj5wv5c&limit=6'
		);

		const jsonData = await res.json();
		//	console.log(jsonData);

		return jsonData;
	})();
</script>

<svelte:head>
	<title>Star Forge Cardano Stake Pool</title>
	<meta
		name="description"
		content="Best Cardano ADA Stake Pool to earn passive income and support a decentralized blockchain."
	/>
</svelte:head>

<div class="">
	<div class="absolute inset-x-10 top-56 grid grid-cols-8 gap-1 z-30">
		<div class="hidden lg:block col-start-1 col-span-1" />
		<div class="col-start-2 col-span-6 place-self-center">
			<Typewriter cursor={false} mode="loopOnce" interval="150" delay="400" wordInterval="1250">
				<h1 class="text-2xl">Welcome Traveler!</h1>
				<h1 class="text-2xl">To The Only Mobile Off The Grid</h1>
				<h1 class="text-2xl">Cardano Stake Pool</h1>
				<h1 class="text-2xl">Have A Nice Day!</h1>
			</Typewriter>
		</div>
		<div class="hidden lg:block col-end-9 col-span-1 place-self-end" />
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
				<div class=" flex justify-center text-center">
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
							<dt class="text-sm font-medium truncate">Saturated</dt>
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
				src="{base}/assets/images/Star-Forge-Sun.webp"
				alt="Cardano Stake Pool Star Forge"
			/>
			<p
				class="mt-2 bg-gradient-to-r from-accent to-teal-500 bg-clip-text text-3xl font-semibold tracking-wider text-transparent lg:text-4xl"
			>
				Mobile Cardano Stake Pool
			</p>
			<p class="mt-2 text-xl font-semibold tracking-tight">Ticker = OTG (Off The Grid)</p>
			<span
				class="relative pb-5 z-0 m-5 inline-grid grid-cols-2 justify-center gap-4 md:grid-cols-5 md:gap-0"
			>
				<button
					on:click={() => handleClick((location.href = 'https://claim.silktoad.io/cardano/claim'))}
					rel="nofollow"
					href="https://claim.silktoad.io/cardano/claim"
					tabIndex="0"
					type="button"
					class="btn-ghost relative -ml-px inline-flex items-center justify-center rounded-md border border-accent px-4 py-2 text-sm font-medium hover:border-accent focus:z-10 focus:outline-none focus:ring-1 md:rounded-none md:rounded-l-md"
				>
					Silk Toad 🐸
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
					on:click={() => handleClick((location.href = 'https://twitter.com/Star_Forge_Pool'))}
					rel="nofollow"
					href="https://twitter.com/Star_Forge_Pool"
					type="button"
					class="btn-ghost relative -ml-px items-center justify-center rounded-md border border-accent px-4 py-2 text-sm font-medium hover:border-accent focus:z-10 focus:outline-none focus:ring-1 md:rounded-none"
					style="display: flex; align-items: center;"
				>
					<span class="mr-1">Twitter</span>
					<svg
						width="20"
						height="20"
						version="1.1"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 300 251"
					>
						<!-- White Circle Background -->
						<circle cx="150" cy="125.5" r="150" fill="#fff" />

						<!-- Original Path -->
						<path
							d="M178.57 127.15 290.27 0h-26.46l-97.03 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.4-116.59 81.8 116.59h89.34M36.01 19.54H76.66l187.13 262.13h-40.66"
						/>
					</svg>
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
		</div>
	</div>
	<div>
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
				<div class="mt-4 lg:mt-0">
					<section class="overflow-hidden">
						<div class="wrapper rounded-lg border-2 border-accent">
							<div class="frame-container">
								<iframe
									width="100%"
									height="500"
									src="https://www.youtube.com/embed/EDiMqimIg-o?modestbranding=1&autohide=1&showinfo=0&controls=0"
									title="Cardano SPO Nomad (OTG)"
									frameborder="0"
									allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
									allowfullscreen
								/>
							</div>
						</div>
					</section>
					<div class="mx-auto">
						<div>
							<h4
								class="pt-10 leading-8 font-extrabold tracking-tight font- text-4xl bg-clip-text text-transparent bg-gradient-to-r from-accent to-teal-500 text-center"
							>
								Decentralization First
							</h4>
						</div>
						<div>
							<p class="container-fluid mx-auto mb-10 mt-5 max-w-prose text-xl">
								This pool focuses primarily on decentralizing block production away from data
								centers like AWS & Digital Ocean. We will always advocate for keeping the L1 ledger
								as small as possible and being able to run cardano-node on low powered ARM
								architecture.
							</p>
							<div>
								<h4
									class="py-6 leading-8 font-extrabold tracking-tight font- text-4xl bg-clip-text text-transparent bg-gradient-to-r from-accent to-teal-500 text-center"
								>
									Disaster Preparedness
								</h4>
							</div>
							<div class="-mb-5 flex items-center justify-center" />
						</div>
						<p class="container-fluid mx-auto mb-10 mt-5 max-w-prose text-xl">
							Capable of forging blocks while in motion, parked remotely with the high performance
							Starlink panel or the roof mounted antenna with WWAN networking. The Star Forge was
							designed to operate in the most decentralized manner possible safely auto connecting
							through a Wireguard VPN.
						</p>
						<p class="container-fluid text-center mx-auto mb-10 mt-5 max-w-prose text-xl">
							Everything has a backup including the operator.
						</p>
					</div>
				</div>
			</div>
		</div>
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
						<p class="my-5">
							Cardano's verified random function in scheduling blocks varies in what is referred to
							as 'luck'. ROA fluctuates epoch to epoch depending on VRF.
						</p>
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
						<p class="mb-4">
							Member of the <a class="underline" href="https://armada-alliance.com/"
								>Armada (founding)</a
							>
							and
							<a class="underline" href="https://singlepoolalliance.net/"
								>Cardano Single Pool (spokesman)</a
							>
							alliances.
						</p>
						<p>
							Many of the top single pool operators have become close friends. We work together
							sharing our experiences with one another and connecting relays within Wireguard VPN's
							strengthening each others pools with known good peering.
						</p>
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
						<p class="ml-9 text-lg font-medium leading-6">World Mobile Earth Node(2)</p>
					</dt>
					<dd class="mt-2 ml-9 text-base">
						<p class="mb-4">
							The Star Forge Earth nodes are set to be accommodated within a robust, distributed
							Kubernetes cluster, ensuring optimal performance through high availability.
						</p>
						<p>
							Meanwhile, the mobile forge is anticipated to feature a World Mobile Airnode,
							strategically deployed at major events such as stadiums. This configuration aims to
							deliver the most robust signal possible to clients in dynamic and populous settings.
						</p>
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
						<p class="ml-9 text-lg font-medium leading-6">Redundant Power sources</p>
					</dt>
					<dd class="mt-2 ml-9 text-base">
						<p class="mb-4">
							Star Forge can charge it's batteries several ways. Solar, propane, diesel and grid.
							Both the mobile and original backup location use 900 ah each of LiFeP04
							<a
								class="underline"
								href="https://www.amperetime.com/products/ampere-time-12v-300ah-lithium-lifepo4-battery"
								>storage</a
							>.
						</p>
						<p>
							While in motion the batteries are charged from the vehicle and solar panels. Powering
							the stake pool indefinably.
						</p>
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
						<p class="ml-9 text-lg font-medium leading-6">Starlink Satellite</p>
					</dt>
					<dd class="mt-2 ml-9 text-base">
						<p>
							Both block producer locations use Starlink for it's connection to the internet. The
							mobile stake pool has the high performance Starlink panel capable of in motion block
							production.
						</p>
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
						<p class="ml-9 text-lg font-medium leading-6">Efficient aarch64 hardware</p>
					</dt>
					<dd class="mt-2 ml-9 text-base">
						<p class="mb-4">
							ARM Aarch64 architecture is often considered superior and more efficient in certain
							contexts due to its emphasis on power efficiency, scalability, and versatility.
						</p>
						<p>
							One of the key advantages lies in the energy efficiency of ARM processors, making them
							particularly well-suited for mobile devices, embedded systems, and environments where
							power consumption is a critical factor.
						</p>
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
						<p class="ml-9 text-lg font-medium leading-6">Building for the community</p>
					</dt>
					<dd class="mt-2 ml-9 text-base">
						<p class="mb-4">
							I provide support and open source documentation for operating cardano-node on
							efficient ARM based processors. I wrote many and maintain the <a
								class="underline"
								href="https://armada-alliance.com/docs/">Armada Alliance documentation</a
							>
						</p>
						<p>
							Part of the core development team for <a
								class="underline"
								href="https://vm.adaseal.eu/">Vending Machine</a
							>
							& <a class="underline" href="https://app.tosidrop.io/cardano/claim">TosiDrop.</a>
						</p>
						<p>
							Star Forge Cardano stake pool delegates by pass the fee for claiming premium tokens on
							TosiDrop.
						</p>
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
						<p class="ml-9 text-lg font-medium leading-6">Strategic partnerships</p>
					</dt>
					<dd class="mt-2 ml-9 text-base">
						<p class="mb-4">
							Over the years I have been a part of some great projects. From ISPO's to providing a
							submit-api endpoint. Notable projects include Liqwid Finance & Dexhunter.
						</p>
						<p class="mb-4">
							Star Forge supports and runs open source software when at all possible. Preferably
							software written by single stake pool operators or well known developers who share the
							same vision for Cardano's continued decentralization of block production.
						</p>
						<p />
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
						<p class="ml-9 text-lg font-medium leading-6">Disaster Preparedness</p>
					</dt>
					<dd class="mt-2 ml-9 text-base">
						Our Cardano stake pool operations are equipped with redundant power and internet. 
						They are fortified, hardened, and thoroughly prepared, with backup hardware
						readily available for swift deployment into production.
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
	.frame-container {
		position: relative;
		padding-bottom: 56.25%; /* 16:9 */
		padding-top: 25px;
		width: 300%; /* enlarge beyond browser width */
		left: -100%; /* center */
	}

	.frame-container iframe {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
	.wrapper {
		overflow: hidden;
		max-width: 100%;
	}
</style>
