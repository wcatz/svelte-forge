<svelte:head>
	<title>Cardano Stake Pool 🌟 Star Forge ⚡ - About</title>
	<meta name="description" content="Stake ada on the most efficient blockchain. Cardano is the future and Star Forge stake pool is here to stay"/>
	
</svelte:head>


<script>
	import { base } from '$app/paths';
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

						<p class="mt-8 text-xl leading-8 text-center">
							The efficient 110 Watt Off-The-Grid, fully ARM'ed, solar powered, Starlink connected
							Cardano Stake Pool
						</p>
					</div>
					<div class="prose prose-lg prose-indigo mx-auto mt-6 base-content">
						<h2 class=" bg-clip-text text-transparent bg-gradient-to-r from-accent to-teal-500">
							Overview
						</h2>
						<p>
							The
							<a
								class="underline"
								href="https://cardanoscan.io/pool/c825168836c5bf850dec38567eb4771c2e03eea28658ff291df768ae"
							>
								Star Forge
							</a>
							is solar powered with 2 weeks of LiFePo4 battery storage and connected to the internet
							through Starlink with a failover onto cable internet provider. The pool consumes just 110
							watts of power.
						</p>
						<p>
							Totally off the grid stakepool using solar panels, LiFePo4 batteries Apple Silicon
							and Starlink. I am a founding member of the
							<a class="underline" href="https://armada-alliance.com"> Armada Alliance </a>
							& on the core dev team for
							<a rel="nofollow" href="https://tosidrop.io/" class="underline"> Tosidrop </a>
							. I spend most of my time helping single stake pool operators run on efficient arm based
							computers.
						</p>
						<p>
							I provide support to other Stake Pool operators, writing guides and providing a
							flashable image to quickly spin up and
							<a
								href="https://armada-alliance.com/docs/"
							>
								sync a node within an hour on a Raspberry Pi.
							</a>
						</p>

						<h2 class=" bg-clip-text text-transparent bg-gradient-to-r from-accent to-teal-500">
							Security & Privacy
						</h2>
						<p>
							The block producer is isolated on a seperate vlan with it's own 1
							Gbps interface connected directly to Starlinks power brick.
						  </p>
						  <blockquote>
							<p>
							  All communication to the Core is through a Wireguard UDP VPN.
							  Essentially the pool looks like a couple encrypted webcam feeds
							  on the wire. Network failover to broadband ISP with DDNS
							  updating DNS records.
							</p>
						  </blockquote>
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
						<h2 class=" bg-clip-text text-transparent bg-gradient-to-r from-accent to-teal-500">
							Hardware
						</h2>
						<p>
							True decentralization of the Cardano blockchain provides
							security to everyones investment. Staking to a baremetal single
							pool operator is extremely important and it is up to you to
							stake responsibly. The Star Forge is doing it's part by
							providing an extremely efficient and secure option. Please
							support my work by delegating to my pool. Thank you!
						  </p>
						<ul class="">
							<li>
								<a
									href="https://www.apple.com/shop/buy-mac/mac-mini/apple-m1-chip-with-8-core-cpu-and-8-core-gpu-512gb"
								>
									Mac M1 Mini
								</a>
								x3 <a href="https://asahilinux.org">Asahi Arch Linux</a>
							</li>
							<li>
								<a href="https://www.turris.com/en/omnia/overview/"> Turris Omnia </a>
								open source router
							</li>
							<li>
								<a href="https://www.starlink.com/">Starlink</a> internet service provider
							</li>
							<li>
								<a href="https://www.victronenergy.com/">Victron Solar</a>
								MPPT charge controller and inverter
							</li>
						</ul>
						<figure>
							<img
								class="w-full rounded-lg"
								src="{base}/assets/images/m3-star-forge.jpg"
								alt="Best return on ADA Cardano Stake Pool"
								width="1310"
								height="873"
							/>
							<figcaption>Mac M1 Mini Asahi Arch Linux</figcaption>
						</figure>
						<h2 class=" bg-clip-text text-transparent bg-gradient-to-r from-accent to-teal-500">
							Original Pi-Pool (Deprecated)
						</h2>

						<p>
							It all started in the BERRY pool group. Before the BERRY telegram group was overun with NFT collectors
							there where many pool operators running on Raspi's. As time went on more and more upgraded to more
							powerfull servers.
						</p>
						<p />
						<p>
							The Raspberry Pi is stil viable as of this writing on mainnet as a node. That is very impressive when 
							compared to other chains.
						</p>
						<figure>
							<img
								class="w-full rounded-lg"
								src="{base}/assets/images/pool-on-stool.jpg"
								alt="Raspberry Pi Cardano stake pool"
								width="1310"
								height="873"
							/>
							<figcaption>Original Star Forge</figcaption>
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
						<figure>
							<img
								class="w-full rounded-lg"
								src="{base}/assets/images/completed-packs.jpg"
								alt="Stake ADA passive income Cardano stake pool delegate."
								width="1310"
								height="873"
							/>
							<figcaption>3.8 kWh capacity</figcaption>
						</figure>
					</div>
				</div>
			</div>
		</main>
	</div>
</div>
