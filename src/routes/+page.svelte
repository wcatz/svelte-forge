<script>
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { themeChange } from 'theme-change';
	//import { numberFormatter } from 'number-formatter'

	// NOTE: the element that is using one of the theme attributes must be in the DOM on mount
	onMount(() => {
		themeChange(false);
		// 👆 false parameter is required for svelte
	});

	let getPoolHistory = (async () => {
		const res = await fetch(
			'https://koi4.psilobyte.io/api/v0/pool_history?_pool_bech32=pool1eqj3dzpkcklc2r0v8pt8adrhrshq8m4zsev072ga7a52uj5wv5c&limit=6'
		);

		return await res.json();
	})();

	// delegate Nami
	function handleClick() {
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

<div class="relative h-3/4">
	<div class="absolute top-10 left-1/2 z-10 -translate-x-1/2 transform" />
	<div class="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 transform" />
	<div
		class="starscreen relative overflow-hidden rounded-b-[100px] border-b-4 border-accent bg-cover bg-center md:rounded-b-[200px]"
		style:background-image={`url(../assets/images/stake-pool-hero.jpg)`}
	>
		<div class="navbar bg-transparent">
			<div class="flex-1" />
			<div class="flex-none">
				<label class="pop-on-hover swap-rotate swap">
					<input
						class="hidden"
						type="checkbox"
						data-toggle-theme="luxury,otg"
						data-act-class="ACTIVECLASS"
					/>
					<svg
						class="swap-on m-3 h-10 w-10 fill-current text-yellow-500"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
					>
						<path
							d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"
						/>
					</svg>
					<svg
						class="swap-off m-3 h-10 w-10 fill-current text-gray-400"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
					>
						<path
							d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"
						/>
					</svg>
				</label>
			</div>
		</div>
		<div class="absolute inset-x-10 top-48 flex justify-end overflow-hidden">
			<div class="">
				<video
					class="rounded-t-full rounded-b-xl opacity-50 "
					width="170"
					autoPlay
					muted
					playsInline
					loop
				>
					<source src="{base}/assets/videos/Tosi_Matrix.mp4" type="video/mp4" />
				</video>
			</div>
		</div>
		<div class="absolute top-1/2 left-1/2 w-full -translate-x-1/2 -translate-y-1/2 transform">
			<div class="-ml-44 flex translate-x-1/2 transform overflow-hidden" />
		</div>
	</div>

	<div class="overflow-hidden">
		<div class="relative py-2 sm:py-3 lg:py-4">
			<div class="mx-auto max-w-md px-4 text-center sm:max-w-3xl sm:px-6 lg:max-w-7xl lg:px-8">
				<div class="hidden md:block" />

				<h1 class="mt-5 bg-clip-text text-4xl font-extrabold uppercase tracking-wider lg:text-5xl">
					🌟{' '}
					<span
						class="mt-5 bg-gradient-to-r from-accent to-teal-500 bg-clip-text text-4xl font-extrabold uppercase tracking-wider text-transparent lg:text-5xl"
					>
						Star Forge
					</span>{' '}
					⚡
				</h1>
				<div class="flex items-center justify-center" />

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
						on:click={handleClick}
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
						rel="nofollow"
						href="https://tosidrop.io/"
						tabIndex="0"
						type="button"
						class="btn-ghost relative -ml-px items-center justify-center rounded-md border border-accent px-4 py-2 text-sm font-medium hover:border-accent focus:z-10 focus:outline-none focus:ring-1 md:rounded-none"
					>
						Tosidrop ☔
					</button>
					<button
						rel="nofollow"
						type="button"
						href="https://pool.pm/c825168836c5bf850dec38567eb4771c2e03eea28658ff291df768ae"
						class="btn-ghost relative -ml-px items-center justify-center rounded-md border border-accent px-4 py-2 text-sm font-medium hover:border-accent focus:z-10 focus:outline-none focus:ring-1 md:rounded-none"
					>
						PoolPM
					</button>
					<button
						rel="nofollow"
						href="https://cardanoscan.io/pool/c825168836c5bf850dec38567eb4771c2e03eea28658ff291df768ae"
						type="button"
						class="btn-ghost relative -ml-px items-center justify-center rounded-md border border-accent px-4 py-2 text-sm font-medium hover:border-accent focus:z-10 focus:outline-none focus:ring-1 md:rounded-none"
					>
						Cardanoscan
					</button>
					<button
						rel="nofollow"
						href="https://pooltool.io/pool/c825168836c5bf850dec38567eb4771c2e03eea28658ff291df768ae"
						type="button"
						class="btn-ghost relative -ml-px items-center justify-center rounded-md border border-accent px-4 py-2 text-sm font-medium hover:border-accent focus:z-10 focus:outline-none focus:ring-1 md:rounded-none"
					>
						PoolTool
					</button>
					<button
						rel="nofollow"
						href="https://adatools.io/pools/c825168836c5bf850dec38567eb4771c2e03eea28658ff291df768ae"
						type="button"
						class="btn-ghost relative -ml-px items-center justify-center rounded-md border border-accent px-4 py-2 text-sm font-medium hover:border-accent focus:z-10 focus:outline-none focus:ring-1 md:rounded-none md:rounded-r-md"
					>
						AdaTools
					</button>
				</span>

				<p class="container-fluid mx-auto mb-10 mt-5 max-w-prose text-xl">
					The Star Forge is a fully ARM'ed solar powered Starlink connected Off The Grid Cardano
					Stake Pool with 2 weeks of LiFePo4 battery storage.
				</p>
			</div>
		</div>
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
									src="{base}/assets/images/better-img.png"
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
							<source src="{base}/assets/videos/TosiDrop.mp4" type="video/mp4" />
						</video>
						<div>
							<div>
								<h4 class="text-center leading-8 tracking-tight">Next Drop In</h4>
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
						<p class="mx-auto mb-10 mt-5 max-w-prose text-xl">
							From there you can either connect your dapp capable wallet or manually enter your
							wallets stake key or a recieving address from the wallet currently staked to the pool
							You will be presented with a list of current token distributions. You can choose to
							claim all of them or only the ones you want.
						</p>
					</div>
				</div>
				<div class="items-center justify-center" />
			</div>
		</div>
		<div>
			<div class="relative py-2 sm:py-4 lg:py-6">
				<div class="mx-auto max-w-md px-4 text-center sm:max-w-3xl sm:px-6 lg:max-w-7xl lg:px-8">
					<div class="mb-1 overflow-auto rounded-lg border-2 border-accent">
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
												{val.active_stake / 1000000000000}
											</td>
											<td class="">{val.block_cnt}</td>
											<td class="">
												{val.deleg_rewards / 100000}
											</td>
											<td class="">
												{val.epoch_ros}
											</td>
											<td class="">
												{val.pool_fees / 1000000}
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
	</div>
</div>

<style>
	.starscreen {
		height: 75vh;
	}

	.pop-on-hover {
		@apply transition duration-300 ease-in-out hover:scale-110;
	}
</style>
