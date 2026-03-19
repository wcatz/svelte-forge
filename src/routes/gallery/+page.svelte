<script>
	import { base } from '$app/paths';
	import HudPanel from '$lib/component/hud-panel.svelte';
	import ScanLines from '$lib/component/scan-lines.svelte';

	const sections = [
		{
			title: 'Mobile Forge',
			images: [
				{ src: 'mobile-lifepo4-bank.jpg', alt: '900Ah LiFePO4 battery bank with Victron MPPT', span: true },
				{ src: 'mobile-victron-multiplus.jpg', alt: 'Victron MultiPlus inverter install' },
				{ src: 'victron-install.jpg', alt: 'Victron inverter and wiring in progress' },
				{ src: 'm3-star-forge.webp', alt: 'Mobile forge interior' },
				{ src: 'stake-pool-batteries.jpg', alt: 'Battery compartment overview' },
				{ src: 'better-img.webp', alt: 'Mobile forge exterior' },
				{ src: 'fleet-sunset.jpg', alt: 'Cybertruck, trailer, and mobile forge at sunset' },
				{ src: 'mobile-starlink.jpg', alt: 'Mobile Starlink deployment' }
			]
		},
		{
			title: 'Current Bare Metal',
			images: [
				{ src: 'current-bare-metal.jpg', alt: 'Current ARM64 node with red ambient lighting', span: true },
				{ src: 'm1-star-forge.webp', alt: 'Bare metal node rack' },
				{ src: 'm2-star-forge.webp', alt: 'Server hardware closeup' }
			]
		},
		{
			title: 'Original Pi-Pool',
			images: [
				{ src: 'pipool-night-glow.jpg', alt: 'Pi-Pool at night — Cardano logo, voltage displays, Pi cluster', span: true },
				{ src: 'pipool-full-view.jpg', alt: 'Full Pi-Pool cabinet with Cardano medallion and Victron gear' },
				{ src: 'original-pipool-cabinet.jpg', alt: 'Original cabinet build with 18650 packs' },
				{ src: 'pi-cluster-watt-meter.jpg', alt: 'Pi cluster with watt meter reading' },
				{ src: 'stake-cardano.webp', alt: 'Original Raspberry Pi stake pool' },
				{ src: 'ssd-stake-pool.webp', alt: 'SSD powered stake pool' }
			]
		},
		{
			title: 'Power Systems',
			images: [
				{ src: 'original-18650-victron.jpg', alt: '18650 pack with Victron inverter and MPPT solar controller' },
				{ src: 'solar-panel-ground-mount.jpg', alt: 'Solar panel on ground mount' },
				{ src: '18650-powerwall.webp', alt: '18650 cell powerwall build' },
				{ src: 'completed-packs.webp', alt: 'Completed battery packs' },
				{ src: 'soldering-powerwall-18650.webp', alt: 'Soldering 18650 cells' },
				{ src: 'powerwall-fuse-positive.webp', alt: 'Powerwall fuse and positive bus' }
			]
		},
		{
			title: 'The Farm',
			images: [
				{ src: 'strawberry-cardano.webp', alt: 'Star Forge strawberry farm' },
				{ src: 'strawberry-blossom.webp', alt: 'Strawberry blossoms' },
				{ src: 'strawberries-bins.webp', alt: 'Harvested strawberries' },
				{ src: 'baby-ducks.webp', alt: 'Farm ducks' },
				{ src: 'ducks-big.webp', alt: 'Grown ducks' },
				{ src: 'ducks-on-grass.webp', alt: 'Ducks on grass' }
			]
		}
	];
</script>

<svelte:head>
	<title>Infrastructure Gallery | Star Forge Cardano Stake Pool</title>
	<meta
		name="description"
		content="Photos of Star Forge's solar-powered Cardano infrastructure — battery banks, ARM64 nodes, mobile forge, and off-grid power systems."
	/>
	<link rel="canonical" href="https://adamantium.online/gallery" />
</svelte:head>

<div class="flex flex-col min-h-screen texture relative">
	<ScanLines opacity={0.015} />

	<div class="relative z-20 px-4 sm:px-6 lg:px-8 py-6">
		<div class="max-w-7xl mx-auto space-y-6">

			<div class="mb-2">
				<h1 class="text-2xl font-mono font-bold tracking-[0.2em] bg-gradient-to-r from-amber-500 via-cyan-400 to-amber-500 bg-clip-text text-transparent">
					VISUAL LOG
				</h1>
				<p class="text-xs font-mono text-green-500/50 mt-1 tracking-wider">STAR FORGE INFRASTRUCTURE DOCUMENTATION</p>
			</div>

			{#each sections as section}
				<HudPanel title={section.title}>
					<div class="grid grid-cols-2 md:grid-cols-3 gap-3">
						{#each section.images as image}
							<div
								class="group relative overflow-hidden rounded border border-green-500/10 hover:border-cyan-500/30 transition-colors duration-200
									{image.span ? 'row-span-2' : ''}"
							>
								<img
									src="{base}/assets/images/{image.src}"
									alt={image.alt}
									loading="lazy"
									width="800"
									height="600"
									class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300
										{image.span ? 'min-h-[300px]' : 'aspect-[4/3]'}"
								/>
								<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
								<div class="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
									<span class="text-[10px] font-mono text-green-400/80 tracking-wider">{image.alt}</span>
								</div>
							</div>
						{/each}
					</div>
				</HudPanel>
			{/each}

		</div>
	</div>
</div>

<style>
	.texture {
		background-image: url('/assets/cubes.png');
		background-size: auto;
	}
</style>
