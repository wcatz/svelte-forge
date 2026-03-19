<script>
	import '../app.css';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { themeChange } from 'theme-change';

	let { children } = $props();

	var today = new Date();
	var year = today.getFullYear();

	onMount(() => {
		themeChange(false);
	});

	const navItems = [
		{ href: '/', label: 'Bridge', icon: 'home' },
		{ href: '/gallery', label: 'Gallery', icon: 'gallery' },
		{ href: '/game', label: 'Arcade', icon: 'game' },
		{ href: '/about', label: 'About', icon: 'about' }
	];

	const scannerLinks = [
		{ label: 'TosiDrop', href: 'https://tosidrop.me/claims' },
		{ label: 'PoolPM', href: 'https://pool.pm/c825168836c5bf850dec38567eb4771c2e03eea28658ff291df768ae' },
		{ label: 'PoolTool', href: 'https://pooltool.io/pool/c825168836c5bf850dec38567eb4771c2e03eea28658ff291df768ae' },
		{ label: 'AdaStat', href: 'https://adastat.net/pools/c825168836c5bf850dec38567eb4771c2e03eea28658ff291df768ae' },
		{ label: 'Twitter', href: 'https://twitter.com/Star_Forge_Pool' }
	];

	let scanDrawerOpen = $state(false);
</script>

<!-- Desktop Nav — cockpit side rail -->
<nav aria-label="Main navigation" class="hidden lg:flex fixed left-0 top-0 bottom-0 z-50 w-44 flex-col border-r border-green-500/20 bg-black/80 backdrop-blur-sm">
	<div class="flex-1 flex flex-col justify-center px-3">
		<ul class="space-y-1">
			{#each navItems as item}
				{@const active = page.url.pathname === item.href}
				<li>
					<a
						href={item.href}
						class="group flex items-center gap-3 px-3 py-2.5 rounded font-mono text-sm tracking-wider transition-all duration-200
							{active
								? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20'
								: 'text-green-500/80 hover:text-green-400 hover:bg-green-500/5 border border-transparent'}"
						style={active ? 'text-shadow: 0 0 8px rgba(6,182,212,0.4)' : 'text-shadow: 0 0 6px rgba(0,255,0,0.2)'}
					>
						{#if item.icon === 'home'}
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 flex-shrink-0 {active ? 'text-cyan-400' : 'text-amber-500/70'}">
								<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
							</svg>
						{:else if item.icon === 'gallery'}
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 flex-shrink-0 {active ? 'text-cyan-400' : 'text-amber-500/70'}">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
								<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
							</svg>
						{:else if item.icon === 'game'}
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 flex-shrink-0 {active ? 'text-cyan-400' : 'text-amber-500/70'}">
								<path stroke-linecap="round" stroke-linejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
							</svg>
						{:else if item.icon === 'about'}
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 flex-shrink-0 {active ? 'text-cyan-400' : 'text-amber-500/70'}">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
							</svg>
						{/if}
						{item.label}
						{#if active}
							<span class="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_4px_rgba(6,182,212,0.6)]" />
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	</div>

	<!-- Bottom: system info -->
	<div class="px-4 py-3 border-t border-green-500/10">
		<div class="text-[10px] font-mono text-green-500/30 tracking-wider">SYS v5.0</div>
	</div>
</nav>

<!-- Mobile Scanner Drawer — slides up from bottom nav -->
{#if scanDrawerOpen}
	<!-- Backdrop -->
	<button
		class="fixed inset-0 z-40 lg:hidden bg-black/40"
		aria-label="Close scanner drawer"
		onclick={() => scanDrawerOpen = false}
	/>
{/if}
<div
	class="fixed left-0 right-0 bottom-16 z-40 lg:hidden transition-transform duration-200 ease-out
		{scanDrawerOpen ? 'translate-y-0' : 'translate-y-[calc(100%+4rem)]'}"
	style="padding-bottom: env(safe-area-inset-bottom, 0px)"
>
	<div class="bg-black/95 border-t border-green-500/20 backdrop-blur-sm px-4 py-3">
		<div class="flex flex-wrap gap-2 justify-center">
			{#each scannerLinks as link}
				<a
					href={link.href}
					rel="noopener noreferrer"
					target="_blank"
					onclick={() => scanDrawerOpen = false}
					class="text-xs font-mono px-3 py-1.5 rounded border border-green-500/20 text-green-500/70 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors tracking-wider"
				>
					{link.label}
				</a>
			{/each}
		</div>
	</div>
</div>

<!-- Mobile Bottom Nav — cockpit control strip -->
<nav aria-label="Mobile navigation" class="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-green-500/20 bg-black/90 backdrop-blur-sm" style="padding-bottom: env(safe-area-inset-bottom, 0px)">
	<div class="flex items-stretch h-16">
		{#each navItems as item}
			{@const active = page.url.pathname === item.href}
			<a
				href={item.href}
				class="flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-200
					{active ? 'text-cyan-400' : 'text-green-500/60 hover:text-green-400'}"
				style={active ? 'text-shadow: 0 0 6px rgba(6,182,212,0.4)' : ''}
				aria-label={item.label}
			>
				{#if item.icon === 'home'}
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
					</svg>
				{:else if item.icon === 'gallery'}
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
						<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
					</svg>
				{:else if item.icon === 'game'}
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
					</svg>
				{:else if item.icon === 'about'}
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
					</svg>
				{/if}
				<span class="text-[10px] font-mono tracking-wider">{item.label}</span>
				{#if active}
					<span class="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
				{/if}
			</a>
		{/each}
		<!-- Scan button -->
		<button
			onclick={() => scanDrawerOpen = !scanDrawerOpen}
			class="flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-200
				{scanDrawerOpen ? 'text-cyan-400' : 'text-green-500/60 hover:text-green-400'}"
			style={scanDrawerOpen ? 'text-shadow: 0 0 6px rgba(6,182,212,0.4)' : ''}
			aria-label="Scanner links"
		>
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
			</svg>
			<span class="text-[10px] font-mono tracking-wider">Scan</span>
			{#if scanDrawerOpen}
				<span class="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
			{/if}
		</button>
	</div>
</nav>

<!-- Main content area — offset for desktop side rail -->
<main class="lg:ml-44 pb-20 lg:pb-0">
	{@render children()}
</main>

<!-- Footer — cockpit status bar -->
<footer class="lg:ml-44 border-t border-green-500/20 bg-black/60 px-4 sm:px-6 lg:px-8 py-3">
	<div class="max-w-7xl mx-auto flex items-center justify-between">
		<div class="flex items-center gap-3">
			<span class="w-2 h-2 rounded-full bg-green-500/40" />
			<span class="text-[10px] font-mono text-green-500/40 tracking-wider">&copy; {year} STAR FORGE</span>
		</div>
		<div class="flex items-center gap-4">
			<a href="https://twitter.com/Star_Forge_Pool" target="_blank" rel="noopener noreferrer" aria-label="Twitter" class="text-base-content/30 hover:text-cyan-400 transition-colors">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" class="fill-current">
					<path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
				</svg>
			</a>
			<a href="https://github.com/wcatz" target="_blank" rel="noopener noreferrer" aria-label="GitHub" class="text-base-content/30 hover:text-cyan-400 transition-colors">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" class="fill-current">
					<path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
				</svg>
			</a>
			<a href="https://t.me/StarForgeCardano" target="_blank" rel="noopener noreferrer" aria-label="Telegram" class="text-base-content/30 hover:text-cyan-400 transition-colors">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" class="fill-current">
					<path d="M22.05 1.577c-.393-.016-.784.08-1.117.235-.484.186-4.92 1.902-9.41 3.64-2.26.873-4.518 1.746-6.256 2.415-1.737.67-3.045 1.168-3.114 1.192-.46.16-1.082.362-1.61.984-.133.155-.267.354-.335.628s-.038.622.095.895c.265.547.714.773 1.244.976 1.76.564 3.58 1.102 5.087 1.608.556 1.96 1.09 3.927 1.618 5.89.174.394.553.54.944.544l-.002.02s.307.03.606-.042c.3-.07.677-.244 1.02-.565.377-.354 1.4-1.36 1.98-1.928l4.37 3.226.035.02s.484.34 1.192.388c.354.024.82-.044 1.22-.337.403-.294.67-.767.795-1.307.374-1.63 2.853-13.427 3.276-15.38l-.012.046c.296-1.1.187-2.108-.496-2.705-.342-.297-.736-.427-1.13-.444zm-.118 1.874c.027.025.025.025.002.027-.007-.002.08.118-.09.755l-.007.024-.005.022c-.432 1.997-2.936 13.9-3.27 15.356-.046.196-.065.182-.054.17-.1-.015-.285-.094-.3-.1l-7.48-5.525c2.562-2.467 5.182-4.7 7.827-7.08.468-.235.39-.96-.17-.972-.594.14-1.095.567-1.64.84-3.132 1.858-6.332 3.492-9.43 5.406-1.59-.553-3.177-1.012-4.643-1.467 1.272-.51 2.283-.886 3.278-1.27 1.738-.67 3.996-1.54 6.256-2.415 4.522-1.748 9.07-3.51 9.465-3.662l.032-.013.03-.013c.11-.05.173-.055.202-.057 0 0-.01-.033-.002-.026zM10.02 16.016l1.234.912c-.532.52-1.035 1.01-1.398 1.36z" />
				</svg>
			</a>
			<a href="https://discord.gg/jTcTKUYj64" target="_blank" rel="noopener noreferrer" aria-label="Discord" class="text-base-content/30 hover:text-cyan-400 transition-colors">
				<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="fill-current">
					<path d="M19.54 0c1.356 0 2.46 1.104 2.46 2.472v21.528l-2.58-2.28-1.452-1.344-1.536-1.428.636 2.22h-13.608c-1.356 0-2.46-1.104-2.46-2.472v-16.224c0-1.368 1.104-2.472 2.46-2.472h16.08zm-4.632 15.672c2.652-.084 3.672-1.824 3.672-1.824 0-3.864-1.728-6.996-1.728-6.996-1.728-1.296-3.372-1.26-3.372-1.26l-.168.192c2.04.624 2.988 1.524 2.988 1.524-1.248-.684-2.472-1.02-3.612-1.152-.864-.096-1.692-.072-2.424.024l-.204.024c-.42.036-1.44.192-2.724.756-.444.204-.708.348-.708.348s.996-.948 3.156-1.572l-.12-.144s-1.644-.036-3.372 1.26c0 0-1.728 3.132-1.728 6.996 0 0 1.008 1.74 3.66 1.824 0 0 .444-.54.804-.996-1.524-.456-2.1-1.416-2.1-1.416l.336.204.048.036.047.027.014.006.047.027c.3.168.6.3.876.408.492.192 1.08.384 1.764.516.9.168 1.956.228 3.108.012.564-.096 1.14-.264 1.74-.516.42-.156.888-.384 1.38-.708 0 0-.6.984-2.172 1.428.36.456.792.972.792.972zm-5.58-5.604c-.684 0-1.224.6-1.224 1.332 0 .732.552 1.332 1.224 1.332.684 0 1.224-.6 1.224-1.332.012-.732-.54-1.332-1.224-1.332zm4.38 0c-.684 0-1.224.6-1.224 1.332 0 .732.552 1.332 1.224 1.332.684 0 1.224-.6 1.224-1.332 0-.732-.54-1.332-1.224-1.332z" />
				</svg>
			</a>
		</div>
	</div>
</footer>
