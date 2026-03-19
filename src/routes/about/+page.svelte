<svelte:head>
	<title>About Star Forge [OTG] | Off-Grid Cardano Stake Pool</title>
	<meta name="description" content="Star Forge [OTG] is a solar-powered, ARM64, Starlink-connected Cardano stake pool. Founding member of Armada Alliance, operating since epoch 208." />
	<link rel="canonical" href="https://adamantium.online/about" />
</svelte:head>

<script>
	import { base } from '$app/paths';
	import HudPanel from '$lib/component/hud-panel.svelte';
	import ScanLines from '$lib/component/scan-lines.svelte';

	let videoEl = $state();
	let videoPlaying = $state(false);

	function toggleVideo() {
		if (!videoEl) return;
		if (videoEl.paused) {
			videoEl.play();
			videoPlaying = true;
		} else {
			videoEl.pause();
			videoPlaying = false;
		}
	}
</script>

<div class="flex flex-col min-h-screen texture relative">
	<ScanLines opacity={0.015} />

	<!-- Hero -->
	<div class="relative z-20 border-b border-green-500/20 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
		<div class="max-w-4xl mx-auto text-center">
			<img
				class="h-20 w-20 mx-auto mb-6 drop-shadow-[0_0_12px_rgba(251,191,36,0.3)]"
				src="{base}/assets/images/Star-Forge-Sun.webp"
				alt="Star Forge"
			/>
			<h1 class="text-4xl sm:text-5xl font-mono font-bold tracking-[0.15em] bg-gradient-to-r from-amber-500 via-cyan-400 to-amber-500 bg-clip-text text-transparent">
				STAR FORGE
			</h1>
			<p class="mt-2 text-sm font-mono text-green-500/60 tracking-[0.3em]">OFF THE GRID SINCE EPOCH 208</p>
			<p class="mt-6 text-lg sm:text-xl font-mono text-base-content/80 max-w-2xl mx-auto leading-relaxed">
				A mobile, solar-powered Cardano stake pool running ARM64 processors on Starlink satellite internet. 110 watts. No compromise.
			</p>
		</div>
	</div>

	<!-- Content -->
	<div class="relative z-20 flex-1 px-4 sm:px-6 lg:px-8 py-8">
		<div class="max-w-5xl mx-auto space-y-8">

			<!-- Video -->
			<HudPanel title="Star Forge Overview">
				<div class="relative aspect-video rounded overflow-hidden bg-black/50 cursor-pointer group" role="button" tabindex="0" onclick={toggleVideo} onkeydown={(e) => e.key === 'Enter' && toggleVideo()}>
					<video
						bind:this={videoEl}
						class="w-full h-full object-cover"
						poster="{base}/assets/images/vid-cover.jpg"
						onended={() => videoPlaying = false}
						preload="metadata"
					>
						<source src="{base}/assets/videos/star-2.mp4" type="video/mp4" />
						<track kind="captions" />
					</video>
					{#if !videoPlaying}
						<div class="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
							<div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-amber-500/80 bg-black/50 flex items-center justify-center group-hover:border-amber-400 group-hover:scale-110 transition-all">
								<svg class="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 ml-1" fill="currentColor" viewBox="0 0 24 24">
									<path d="M8 5v14l11-7z"/>
								</svg>
							</div>
						</div>
					{/if}
				</div>
			</HudPanel>

			<!-- The Story -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<HudPanel title="The Mission">
					<div class="space-y-4 text-sm font-mono text-base-content/70 leading-relaxed">
						<p>
							Star Forge started in the BERRY pool group back when running Cardano on a Raspberry Pi was the cutting edge of decentralization. Most operators eventually moved to cloud servers. I went the other direction.
						</p>
						<p>
							The idea was simple: if Cardano is supposed to be decentralized, why run it in the same data centers as everything else? So I built a stake pool that runs entirely off-grid — solar panels, LiFePO4 batteries, and Starlink for connectivity.
						</p>
						<p>
							Today Star Forge operates from two locations with redundant power and internet at each. The mobile forge can produce blocks while driving down the highway. Both block producers connect through Wireguard VPN with automatic failover.
						</p>
					</div>
				</HudPanel>

				<HudPanel title="Why It Matters">
					<div class="space-y-4 text-sm font-mono text-base-content/70 leading-relaxed">
						<p>
							Every pool running in AWS or Hetzner is a single point of failure for the network. A policy change, a billing dispute, or a regional outage can take hundreds of pools offline simultaneously.
						</p>
						<p>
							Bare metal pools operated by individuals are the backbone of real decentralization. Star Forge proves you can run production infrastructure on 110 watts of solar power without sacrificing reliability or performance.
						</p>
						<p>
							As a founding member of the <a href="https://armada-alliance.com/" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 transition-colors">Armada Alliance</a> and spokesman for the <a href="https://singlepoolalliance.net/" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 transition-colors">Cardano Single Pool Alliance</a>, I work to help other operators run efficient, independent nodes.
						</p>
					</div>
				</HudPanel>
			</div>

			<!-- Current Infrastructure -->
			<HudPanel title="Current Infrastructure">
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
					<figure class="space-y-2">
						<img
							class="w-full rounded border border-green-500/10"
							src="{base}/assets/images/current-bare-metal.jpg"
							alt="Current bare metal server rack with Mac M1 Minis running Cardano nodes"
							width="800" height="600"
							loading="lazy"
						/>
						<figcaption class="text-xs font-mono text-base-content/40">Home base — Mac M1 Mini cluster on Asahi Linux</figcaption>
					</figure>
					<figure class="space-y-2">
						<img
							class="w-full rounded border border-green-500/10"
							src="{base}/assets/images/fleet-sunset.jpg"
							alt="Mobile stake pool RV at sunset"
							width="800" height="600"
							loading="lazy"
						/>
						<figcaption class="text-xs font-mono text-base-content/40">Mobile forge — block production on the move</figcaption>
					</figure>
				</div>

				<div class="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
					<div class="border border-green-500/10 rounded bg-black/20 p-3 text-center">
						<span class="block text-lg font-mono font-bold text-cyan-400">3x</span>
						<span class="text-[10px] font-mono text-base-content/50 tracking-wider">MAC M1 MINI</span>
					</div>
					<div class="border border-green-500/10 rounded bg-black/20 p-3 text-center">
						<span class="block text-lg font-mono font-bold text-cyan-400">900 Ah</span>
						<span class="text-[10px] font-mono text-base-content/50 tracking-wider">LiFePO4 STORAGE</span>
					</div>
					<div class="border border-green-500/10 rounded bg-black/20 p-3 text-center">
						<span class="block text-lg font-mono font-bold text-cyan-400">110W</span>
						<span class="text-[10px] font-mono text-base-content/50 tracking-wider">TOTAL DRAW</span>
					</div>
					<div class="border border-green-500/10 rounded bg-black/20 p-3 text-center">
						<span class="block text-lg font-mono font-bold text-cyan-400">2</span>
						<span class="text-[10px] font-mono text-base-content/50 tracking-wider">STARLINK UPLINKS</span>
					</div>
				</div>

				<div class="mt-6 space-y-2 text-sm font-mono text-base-content/60 leading-relaxed">
					<p>
						The home base runs a K3s Kubernetes cluster across three Mac M1 Minis with Asahi Linux. GitOps managed with Helmfile, encrypted secrets via SOPS + Age, full observability through Prometheus and Grafana.
					</p>
					<p>
						Power comes from solar panels charging LiFePO4 batteries through Victron MPPT controllers and inverters. The mobile forge charges from both solar and vehicle alternator while driving.
					</p>
				</div>
			</HudPanel>

			<!-- Mobile Forge Detail -->
			<HudPanel title="Mobile Forge">
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					<figure class="space-y-2">
						<img
							class="w-full rounded border border-green-500/10"
							src="{base}/assets/images/mobile-lifepo4-bank.jpg"
							alt="LiFePO4 battery bank in the mobile forge"
							width="800" height="600"
							loading="lazy"
						/>
						<figcaption class="text-xs font-mono text-base-content/40">LiFePO4 battery bank</figcaption>
					</figure>
					<figure class="space-y-2">
						<img
							class="w-full rounded border border-green-500/10"
							src="{base}/assets/images/mobile-victron-multiplus.jpg"
							alt="Victron MultiPlus inverter/charger installation"
							width="800" height="600"
							loading="lazy"
						/>
						<figcaption class="text-xs font-mono text-base-content/40">Victron MultiPlus inverter</figcaption>
					</figure>
					<figure class="space-y-2">
						<img
							class="w-full rounded border border-green-500/10"
							src="{base}/assets/images/victron-install.jpg"
							alt="Victron solar charge controller and wiring"
							width="800" height="600"
							loading="lazy"
						/>
						<figcaption class="text-xs font-mono text-base-content/40">Charge controller install</figcaption>
					</figure>
				</div>
				<p class="mt-4 text-sm font-mono text-base-content/60 leading-relaxed">
					The mobile forge produces blocks while in transit. Starlink's high-performance antenna maintains connectivity on the move, and the Wireguard VPN auto-reconnects across network changes. Sub-second block propagation delay — verified in production.
				</p>
			</HudPanel>

			<!-- Community -->
			<HudPanel title="Community Work">
				<div class="space-y-4 text-sm font-mono text-base-content/70 leading-relaxed">
					<p>
						Beyond running the pool, I contribute to several Cardano community projects. Core developer for <a href="https://vm.adaseal.eu/" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 transition-colors">Vending Machine</a> and <a href="https://tosidrop.me/claims" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 transition-colors">TosiDrop</a>. Star Forge delegators bypass premium token claiming fees on TosiDrop.
					</p>
					<p>
						Maintainer of Armada Alliance documentation and tooling. I write guides and maintain disk images so new operators can get a node synced on ARM hardware within an hour.
					</p>
					</div>
			</HudPanel>

			<!-- Origin Story -->
			<HudPanel title="Where It Started">
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
					<div class="space-y-4 text-sm font-mono text-base-content/60 leading-relaxed">
						<p>
							The original Star Forge was a cluster of Raspberry Pis powered by a handmade 3.8 kWh battery built from reclaimed 18650 laptop cells. Each cell had to be individually tested, capacity-matched, and soldered with fuses on both sides. The build took hundreds of hours.
						</p>
						<p>
							When Starlink's power requirements outgrew the homemade battery, I upgraded to commercial LiFePO4 and Apple Silicon. The Pi cluster is retired but Raspberry Pi remains viable for running a Cardano node on mainnet — a testament to the protocol's efficiency.
						</p>
					</div>
					<div class="space-y-4">
						<figure class="space-y-2">
							<img
								class="w-full rounded border border-green-500/10"
								src="{base}/assets/images/original-pipool-cabinet.jpg"
								alt="Original Raspberry Pi stake pool cluster in cabinet"
								width="800" height="600"
								loading="lazy"
							/>
							<figcaption class="text-xs font-mono text-base-content/40">Original Pi-Pool cluster</figcaption>
						</figure>
						<figure class="space-y-2">
							<img
								class="w-full rounded border border-green-500/10"
								src="{base}/assets/images/original-18650-victron.jpg"
								alt="Original 18650 battery pack with Victron charge controller"
								width="800" height="600"
								loading="lazy"
							/>
							<figcaption class="text-xs font-mono text-base-content/40">Handmade 18650 powerwall + Victron</figcaption>
						</figure>
					</div>
				</div>
			</HudPanel>

		</div>
	</div>
</div>

<style>
	.texture {
		background-image: url('/assets/cubes.png');
		background-size: auto;
	}
</style>
