<script>
	import { base } from '$app/paths';
	import Typewriter from 'svelte-typewriter';
	import { onMount, onDestroy } from 'svelte';
	import DelegateBtn from './delegate/delegate-btn.svelte';

	const fullBlockSize = 87.97;
	const EpochDurationInDays = 5;
	const SecondsInDay = 24 * 60 * 60;
	const ShelleyEpochStart = '2020-07-29T21:44:51Z';
	const StartingEpoch = 208;
	const epochDurationInSeconds = EpochDurationInDays * SecondsInDay;
	const startEpochTimestamp = new Date(ShelleyEpochStart).getTime() / 1000;
	const currentTimestamp = Math.floor(Date.now() / 1000);
	const totalElapsedTime = currentTimestamp - startEpochTimestamp;
	const elapsedEpochs = Math.floor(totalElapsedTime / epochDurationInSeconds);
	const currentEpoch = StartingEpoch + elapsedEpochs;
	const currentEpochStart = startEpochTimestamp + elapsedEpochs * epochDurationInSeconds;
	const elapsedTimeInCurrentEpoch = currentTimestamp - currentEpochStart;
	const epochProgress = (elapsedTimeInCurrentEpoch / epochDurationInSeconds) * 100;
	const progressPercentage = Math.min(epochProgress, 100).toFixed(0);
	const numberFormatter = Intl.NumberFormat('en-US');

	function handleClick() {}

	const endState = { text: 'deleted'};

	let getPoolInfo = (async () => {
		const res = await fetch('https://koios.tosidrop.io/api/v1/pool_info', {
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
			'https://koios.tosidrop.io/api/v1/pool_history?_pool_bech32=pool1eqj3dzpkcklc2r0v8pt8adrhrshq8m4zsev072ga7a52uj5wv5c&limit=6'
		);
		const jsonData = await res.json();
		//	console.log(jsonData);
		return jsonData;
	})();

	let blockCount = 0;

	// Fetch block count for the current epoch
	let getBlockCount = async () => {
		try {
			const response = await fetch('https://koios.tosidrop.io/api/v1/pool_blocks', {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					_pool_bech32: 'pool1eqj3dzpkcklc2r0v8pt8adrhrshq8m4zsev072ga7a52uj5wv5c',
					_epoch_no: currentEpoch // Calculated current epoch
				})
			});

			if (!response.ok) {
				throw new Error('Failed to fetch pool blocks');
			}

			const jsonData = await response.json();
			blockCount = jsonData.length; // Update the outer blockCount variable
			console.log(`Number of blocks in epoch ${currentEpoch}: ${blockCount}`);
		} catch (error) {
			console.error('Error fetching pool blocks:', error);
			blockCount = 0;
		}
	};

	// Call getBlockCount on component mount
	onMount(() => {
		getBlockCount();
	});
	let video;
	let observer;
	const options = {
		root: null,
		rootMargin: '0px',
		threshold: 0.5
	};

	function handleIntersection(entries) {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				// Video is in view, start playing
				video.play();
			} else {
				// Video is out of view, pause it
				video.pause();
			}
		});
	}

	onMount(() => {
		observer = new IntersectionObserver(handleIntersection, options);
		observer.observe(video);
	});

	onDestroy(() => {
		if (video) {
			observer.disconnect();
		}
	});

	let showTexture = false;

	function handleVideoEnded() {
		showTexture = true;
	}
</script>

<svelte:head>
	<title>Star Forge Cardano Stake Pool</title>
	<meta
		name="description"
		content="Best Cardano ADA Stake Pool to earn passive income and support a decentralized blockchain."
	/>
</svelte:head>

<div class="texture">
	<div>
	<div
		class="starscreen drop-shadow-lg lg:mx-10 mt-3 relative overflow-hidden rounded-b-[100px] border-b-4 border-accent bg-cover bg-center md:rounded-b-[200px] rounded-t-[100px] border-t-4 md:rounded-t-[200px]"
	>
	{#if !showTexture}
	<!-- First video plays initially -->
	<video
	  autoplay
	  muted
	  playsinline
	  class="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
	  on:ended={handleVideoEnded}
	  style="opacity: 1;"
	>
	  <source src="../assets/videos/star-hero.mp4" type="video/mp4" />
	  Your browser does not support the video tag.
	</video>
  {:else}
<!-- Container to center the video -->
<div class="absolute inset-0 flex items-center justify-center opacity-80">
	<!-- Second video plays after the first one ends -->
	<video
	  autoplay
	  muted
	  loop
	  playsinline
	  class="w-3/5 object-cover transition-opacity duration-2000 ease-in-out rounded-t-full"
	  style="opacity: 1;"
	>
	  <source src="https://sdo.gsfc.nasa.gov/assets/img/latest/mpeg/latest_512_0171.mp4" type="video/mp4" />
	  Your browser does not support the video tag.
	</video>
  </div>
  
  {/if}

		<div class="absolute bottom-2 z-30 left-1/2 transform -translate-x-1/2">
			<div class="hidden lg:block">
				{#await getPoolInfo}
					<div class="flex justify-center items-center mb-10">
						<div
							class="
				animate-spin
				rounded-full
				h-10
				w-10
				border-t-2 border-b-2 border-gray-500
			  "
						/>
					</div>
				{:then data}
					<div class="flex justify-center text-center">
						<dl class="flex flex-cols-1 gap-2 sm:flex-cols-7 mb-1">
							<div class="px-4 py-5 sm:p-6">
								<dt class="text-sm text-amber-500 font-medium truncate">Blocks</dt>
								<dd class="mt-1 text-3xl text-cyan-500 font-semibold">
									{data[0].block_count}
								</dd>
								<div class="stat-desc text-green-500" />
							</div>
							<div class="px-4 py-5 sm:p-6">
								<dt class="text-sm text-amber-500 font-medium truncate">Pledge</dt>
								<dd class="mt-1 text-3xl text-cyan-500 font-semibold">500K</dd>
							</div>
							<div class="px-4 py-5 sm:p-6">
								<dt class="text-sm text-amber-500 font-medium truncate">Margin</dt>
								<dd class="mt-1 text-3xl text-cyan-500 font-semibold">
									{data[0].margin * 100}%
								</dd>
							</div>
							<div class="px-4 py-5 sm:p-6">
								<dt class="text-sm text-amber-500 font-medium truncate">Stake</dt>
								<dd class="mt-1 text-3xl text-cyan-500 font-semibold">
									{(data[0].active_stake / 1000000000000).toFixed(2)}M
								</dd>
							</div>
							<div class="px-4 py-5 sm:p-6">
								<dt class="text-sm text-amber-500 font-medium truncate">Delegators</dt>
								<dd class="mt-1 text-3xl text-cyan-500 font-semibold">
									{data[0].live_delegators}
								</dd>
							</div>
							<div class="px-4 py-5 sm:p-6">
								<dt class="text-sm text-amber-500 font-medium truncate">Saturated</dt>
								<dd class="mt-1 text-3xl text-cyan-500 font-semibold">
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
</div>

<div class="absolute inset-0 flex flex-col justify-center items-center z-20">
	<div
		class="hidden lg:block absolute top-10 text-green-500 font-mono text-lg flex items-center group hover:bg-transparent mb-8"
	>
		<DelegateBtn />
		<span
			class="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
		/>
	</div>
	<div class="drop-shadow-lg text-center mb-8">
		<h1
			class="bg-clip-text text-4xl pb-3 font-extrabold uppercase tracking-wider lg:text-5xl text-transparent bg-gradient-to-r from-amber-500 via-cyan-500 to-amber-500"
			style="direction: ltr; unicode-bidi: normal;"
		>
			🌟 Star Forge ⚡
		</h1>
		<img
			class="h-28 w-28 m-auto my-8"
			src="{base}/assets/images/Star-Forge-Sun.webp"
			alt="Cardano Stake Pool Star Forge"
		/>
	</div>

	<!-- Typewriter Section -->
	<div class="text-center">
		<!-- reserved height -->
		<div
			class="typewriter-container text-green-500 font-mono text-2xl tracking-widest lg:text-4xl"
			style="text-shadow: 0 0 10px rgba(0, 255, 0, 0.8); direction: ltr; unicode-bidi: normal;"
		>
			<Typewriter
				cursor={false}
				mode="loopOnce"
				interval={100}
				delay={350}
				pauseFor={2500}
				wordInterval={1500}
				repeat={1}
				endState={endState} 
			>
				<h1>{`Epoch:${currentEpoch}`}</h1>  
				<h1>{`Progress:${progressPercentage}%`}</h1>
				<h1>{`Epoch Blocks:${blockCount}`}</h1>
				<h1></h1>
			</Typewriter>
		</div>
	</div>
</div>

<div class="overflow-hidden">
	<div class="relative py-2 sm:py-3 lg:py-4">
		<div class="mx-auto max-w-md px-4 text-center sm:max-w-3xl sm:px-6 lg:max-w-7xl lg:px-8">
			<div class="hidden md:block" />
			<p class="mt-2 text-xl font-semibold tracking-tight">Ticker = OTG (Off The Grid)</p>
			<span
				class="relative pb-5 z-0 m-5 inline-grid grid-cols-2 justify-center gap-4 md:grid-cols-5 md:gap-0"
			>
				<button
					on:click={() => handleClick((location.href = 'https://www.silktoad.io/claims'))}
					rel="nofollow"
					href="https://www.silktoad.io/claims"
					tabIndex="0"
					type="button"
					class="relative group inline-flex items-center justify-center px-4 py-3 text-lg font-medium text-green-500 font-mono tracking-widest bg-transparent hover:bg-transparent transition duration-200"
					style="text-shadow: 0 0 10px rgba(0, 255, 0, 0.8); direction: ltr; unicode-bidi: normal;"
				>
					Silk Toad 🐸
					<span
						class="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
					/>
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
					class="relative group inline-flex items-center justify-center px-4 py-3 text-lg font-medium text-green-500 font-mono tracking-widest bg-transparent hover:bg-transparent transition duration-200"
					style="text-shadow: 0 0 10px rgba(0, 255, 0, 0.8); direction: ltr; unicode-bidi: normal;"
				>
					PoolPM 🐉
					<span
						class="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
					/>
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
					class="relative group inline-flex items-center justify-center px-4 py-3 text-lg font-medium text-green-500 font-mono tracking-widest bg-transparent hover:bg-transparent transition duration-200"
					style="text-shadow: 0 0 10px rgba(0, 255, 0, 0.8); direction: ltr; unicode-bidi: normal;"
				>
					PoolTool 🎱
					<span
						class="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
					/>
				</button>

				<button
					on:click={() => handleClick((location.href = 'https://twitter.com/Star_Forge_Pool'))}
					rel="nofollow"
					href="https://twitter.com/Star_Forge_Pool"
					type="button"
					class="relative group inline-flex items-center justify-center px-4 py-3 text-lg font-medium text-green-500 font-mono tracking-widest bg-transparent hover:bg-transparent transition duration-200"
					style="text-shadow: 0 0 10px rgba(0, 255, 0, 0.8); direction: ltr; unicode-bidi: normal;"
				>
					<span class="mr-1">Twitter</span>
					<svg
						width="20"
						height="20"
						version="1.1"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 300 251"
					>
						<circle cx="150" cy="125.5" r="150" fill="#fff" />
						<path
							d="M178.57 127.15 290.27 0h-26.46l-97.03 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.4-116.59 81.8 116.59h89.34M36.01 19.54H76.66l187.13 262.13h-40.66"
						/>
					</svg>
					<span
						class="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
					/>
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
					class="relative group inline-flex items-center justify-center px-4 py-3 text-lg font-medium text-green-500 font-mono tracking-widest bg-transparent hover:bg-transparent transition duration-200"
					style="text-shadow: 0 0 10px rgba(0, 255, 0, 0.8); direction: ltr; unicode-bidi: normal;"
				>
					Cexplorer 🔍
					<span
						class="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
					/>
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
					<div class="rounded-lg border-2 border-accent">
						<!-- svelte-ignore a11y-media-has-caption -->
						<video
							bind:this={video}
							class="rounded-lg"
							width="100%"
							controls
							muted
							poster="{base}/assets/images/vid-cover.jpg"
						>
							<source src="{base}/assets/videos/star-2.mp4" type="video/mp4" />
							Your browser does not support the video tag.
						</video>
					</div>

					<div class="mx-auto">
						<div>
							<h4
								class="pt-10 text-center leading-8 bg-gradient-to-r from-amber-500 via-cyan-500 to-amber-500 bg-clip-text text-4xl font-extrabold uppercase tracking-wider text-transparent lg:text-4xl"
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
									class="py-6 pt-10 text-center leading-8 bg-gradient-to-r from-amber-500 via-cyan-500 to-amber-500 bg-clip-text text-4xl font-extrabold uppercase tracking-wider text-transparent lg:text-4xl"
								>
									Disaster Preparedness
								</h4>
							</div>
							<div class="mb-5 flex items-center justify-center" />
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
						class="pt-10 text-center leading-8 bg-gradient-to-r from-amber-500 via-cyan-500 to-amber-500 bg-clip-text text-4xl font-extrabold uppercase tracking-wider text-transparent lg:text-4xl"
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
										  border-t-2 border-b-2 cyan-500
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
			class="py-6 leading-8 bg-gradient-to-r from-amber-500 via-cyan-500 to-amber-500 bg-clip-text text-4xl font-extrabold uppercase tracking-wider text-transparent lg:text-4xl text-center"
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
						Our Cardano stake pool operations are equipped with redundant power and internet. They
						are fortified, hardened, and thoroughly prepared, with backup hardware readily available
						for swift deployment into production.
					</dd>
				</div>
			</dl>
		</div>
	</div>
</div>
</div>

<style>
	.starscreen {
		height: 90vh;
	}
	.fade-in {
		opacity: 0;
		transition: opacity 2s ease-in-out;
	}

	.fade-in.show {
		opacity: 1;
	}
	.typewriter-container {
		min-height: 100px;
	}

	.texture {
		background-image: url('https://adamantium.online/assets/cubes.png');
		background-size: auto;
	}

</style>
