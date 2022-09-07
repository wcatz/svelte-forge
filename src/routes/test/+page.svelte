<script>
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { themeChange } from 'theme-change';

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

<div class="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
	<!-- Static sidebar for desktop -->
</div>
<div class="flex flex-1 flex-col md:pl-36">
	<!-- Main content -->
	<div class="flex flex-1 items-stretch overflow-hidden">
		<main class="flex-1 overflow-y-auto">
			<div class="relative overflow-hidden py-16">
				<div class="hidden lg:absolute lg:inset-y-0 lg:block lg:h-full lg:w-full">
					<div class="relative mx-auto h-full max-w-prose text-lg" aria-hidden="true">
						<svg
							class="absolute top-72 left-full translate-x-32 transform"
							width="404"
							height="384"
							fill="none"
							viewBox="0 0 404 384"
						>
							<defs>
								<pattern
									id="74b3fd99-0a6f-4271-bef2-e80eeafdf357"
									x="0"
									y="0"
									width="20"
									height="20"
									patternUnits="userSpaceOnUse"
								>
									<rect x="0" y="0" width="4" height="4" class="text-accent" fill="currentColor" />
								</pattern>
							</defs>
							<rect width="404" height="384" fill="url(#74b3fd99-0a6f-4271-bef2-e80eeafdf357)" />
						</svg>

						<svg
							class="absolute bottom-12 left-full translate-x-32 transform"
							width="404"
							height="384"
							fill="none"
							viewBox="0 0 404 384"
						>
							<defs>
								<pattern
									id="d3eb07ae-5182-43e6-857d-35c643af9034"
									x="0"
									y="0"
									width="20"
									height="20"
									patternUnits="userSpaceOnUse"
								>
									<rect x="0" y="0" width="4" height="4" class="text-accent" fill="currentColor" />
								</pattern>
							</defs>
							<rect width="404" height="384" fill="url(#d3eb07ae-5182-43e6-857d-35c643af9034)" />
						</svg>
					</div>
				</div>
				<div class="relative px-4 sm:px-6 lg:px-8">
					<div class="mx-auto max-w-prose text-lg">
						<h1>
							<span class="block text-center text-lg font-semibold">About</span>
							<span
								class="pb-4 mt-2 block text-center text-5xl font-bold leading-8 tracking-tight sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-accent to-teal-500"
								>The Star Forge</span
							>
							<span class="block text-center text-lg font-semibold text-accent"
								>Fortune favors the prepared mind</span
							>
							<span class="block text-center text-3xl pt-4">🕊️ 🐭 🦆 🍓 🦣</span>
						</h1>

						<p class="mt-8 text-xl leading-8">
							The efficient 110 Watt Off-The-Grid, fully ARM'ed, solar powered, Starlink connected
							Cardano Stake Pool
						</p>
					</div>
					<div class="prose prose-lg prose-indigo mx-auto mt-6 base-content">
						<p>
							Pool operated by{' '}
							<a
								rel="nofollow"
								class="underline"
								href="https://armada-alliance.com/identities/wcat-otg"
							>
								WCat
							</a>
							. I run a totally off the grid stakepool using solar panels, LiFePo4 batteries Apple Silicon
							and Starlink. I am a founding member of the{' '}
							<a class="underline" href="https://armada-alliance.com"> Armada Alliance </a>{' '}
							& on the core dev team for{' '}
							<a rel="nofollow" href="https://tosidrop.io/" class="underline"> Tosidrop </a>
							. I spend most of my time helping single stake pool operators run on efficient arm based
							computers.
						</p>
						<ul class="text-accent">
							<li>
								<a
									class="underline"
									rel="nofollow"
									href="https://www.ionos.com/digitalguide/server/security/dns-over-tls"
								>
									DNS over TLS (DoT)
								</a>
							</li>
							<li>
								<a
									class="underline"
									rel="nofollow"
									href="https://www.ionos.com/digitalguide/server/know-how/dnssec-internet-standards-for-authenticated-name-resolution"
								>
									DNSSEC
								</a>
							</li>
							<li>
								<a class="underline" rel="nofollow" href="https://tools.ietf.org/html/bcp38">
									Source Address Spoofing Protection (BCP38)
								</a>
							</li>
						</ul>
						<p>
							The{' '}
							<a
								class="underline"
								href="https://cardanoscan.io/pool/c825168836c5bf850dec38567eb4771c2e03eea28658ff291df768ae"
							>
								Star Forge
							</a>{' '}
							is solar powered with 2 weeks of LiFePo4 battery storage and connected to the internet
							through Starlink with a failover onto cable internet provider. The pool consumes just 110
							watts of power.
						</p>
						<h2 class=" bg-clip-text text-transparent bg-gradient-to-r from-accent to-teal-500">
							Security & Privacy
						</h2>
						<p>
							There is a{' '}
							<a
								href="https://testnet.cardanoscan.io/pool/62b968226866ba28af09bd9e6cb700df979aff5b51aedbd49ee90cb6"
							>
								Star Forge testnet pool
							</a>
							, 2 <a href="https://www.freeloaderz.io/">Freeloaderz</a> submit endpoints,{' '}
							<a class="underline" href="https://www.koios.rest/"> Koios </a>{' '}
							and of course my work with the{' '}
							<a href="https://armada-alliance.com/">Armada Alliance</a>.
						</p>

						<p>
							I provide support to other Stake Pool operators, writing guides and providing a
							flashable image to quickly spin up and{' '}
							<a
								href="https://docs.armada-alliance.com/learn/stake-pool-guides/pi-pool-tutorial/pi-node-full-guide"
							>
								sync a node within an hour on a Raspberry Pi.
							</a>
						</p>
						<ul class="">
							<li>
								<a
									href="https://www.apple.com/shop/buy-mac/mac-mini/apple-m1-chip-with-8-core-cpu-and-8-core-gpu-512gb"
								>
									Mac M1 Mini
								</a>{' '}
								x3 <a href="https://asahilinux.org">Asahi Arch Linux</a>
							</li>
							<li>
								<a href="https://www.turris.com/en/omnia/overview/"> Turris Omnia </a>{' '}
								open source router
							</li>
							<li>
								<a href="https://www.starlink.com/">Starlink</a> internet service provider
							</li>
							<li>
								<a href="https://www.victronenergy.com/">Victron Solar</a>{' '}
								MPPT charge controller and inverter
							</li>
						</ul>
						<figure>
							<img
								class="w-full rounded-lg"
								src="{base}/assets/images/completed-packs.jpg"
								alt=""
								width="1310"
								height="873"
							/>
							<figcaption>3.8 kWh capacity</figcaption>
						</figure>
						<h2 class=" bg-clip-text text-transparent bg-gradient-to-r from-accent to-teal-500">
							Powerwall Specs (Deprecated)
						</h2>
						<p>
							Originally I had built a Tesla style Powerwall with lithium ion cells reclaimed from
							old laptop batteries. it was capable of running 3 raspberry Pi's on two solar panels.
							The power requirements for Starlink sealed the handmade batteries fate. I hope to use
							it soon with another project.
						</p>
						<p />
						<p>
							Building this battery took hundreds of hours and I do not recommend it. Each cell has
							to be obtained, taken apart and fully charged. Then discharged while measuring it's
							capacity and charged back up to a storage charge untill all the rest are processed.
							Then the banks need to be balanced, assembled and then soldered with 5 amp fast blow
							glass fuses on both sides. The soldering itself took over 50 hours.
						</p>
					</div>
				</div>
			</div>
		</main>
	</div>
</div>
