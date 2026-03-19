<script>
	import { onMount } from 'svelte';
	import { CANVAS_W, CANVAS_H } from '$lib/game/constants.js';
	import { createGame, resetGame, tick, render } from '$lib/game/engine.js';
	import { titleHitRegions, gameOverHitRegions } from '$lib/game/hud.js';
	// titleHitRegions is a mutable array updated each frame by drawTitleScreen
	import { createInput, handleKeydown, handleKeyup, handleTouchStart, handleTouchMove, handleTouchEnd } from '$lib/game/input.js';
	import { initAudio, resumeAudio, toggleMute, isMuted, startMusic, stopMusic, sfxStart } from '$lib/game/audio.js';
	import { detectWallets, connectWallet, submitScore, fetchLeaderboard, truncateStakeAddr } from '$lib/game/wallet.js';
	const POOL_ID = 'pool1eqj3dzpkcklc2r0v8pt8adrhrshq8m4zsev072ga7a52uj5wv5c';

	let muted = $state(false);

	let canvas;
	let ctx;
	let animFrameId;
	let containerEl;

	const game = createGame();
	const input = createInput();

	let gameState = $state('title');
	let score = $state(0);
	let blocksForged = $state(0);
	let nightEarned = $state(0);
	let isFullscreen = $state(false);

	// Wallet state
	let walletPhase = $state('connect'); // connect | connecting | not-delegated | ready
	let wallets = $state([]);
	let walletsReady = $state(false);
	let walletError = $state('');
	let wallet = $state(null); // { stakeAddress, isDelegated, adaHandle, walletName }
	let leaderboard = $state([]);
	let scoreSubmitted = $state(false);
	let prevGameState = $state('title');
	let lastBlocksForged = 0;
	let selectedWalletId = '';
	let delegateStatus = $state('');
	let nightMultiplier = $state(1); // 10x for delegators, 1x for others
	let guestMode = $state(false); // true when playing without wallet
	let gameSessionId = null;
	let turnstileToken = $state('');
	let turnstileRequired = $state(false);
	let turnstileEl;

	function gameLoop(timestamp) {
		const now = timestamp || performance.now();

		// Sync wallet state into game for canvas rendering
		game.walletState = {
			phase: walletPhase,
			wallets,
			error: walletError,
			leaderboard,
		};
		game.guestMode = guestMode;

		tick(game, input, now);
		render(ctx, game, now);

		gameState = game.state;
		score = game.score;
		blocksForged = game.forge.blocksForged;
		nightEarned = game.forge.nightEarned;

		// Deliver NIGHT tokens on block forge — server determines amount based on delegation
		// Skip reward delivery entirely for guest mode
		if (!guestMode && game.forge.blocksForged > lastBlocksForged && wallet?.sessionToken && gameSessionId) {
			lastBlocksForged = game.forge.blocksForged;
			fetch('/api/game/deliver-reward', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionToken: wallet.sessionToken, gameSessionId }),
			}).catch(() => {});
		}

		// Submit score on game over transition (skip for guest mode — no wallet)
		if (gameState === 'gameover' && prevGameState !== 'gameover' && !guestMode && wallet && !scoreSubmitted) {
			scoreSubmitted = true;
			const displayName = wallet.adaHandle || truncateStakeAddr(wallet.stakeAddress);
			submitScore(wallet.sessionToken, displayName, game.score, game.forge.blocksForged, game.forge.nightEarned)
				.then(res => { if (res?.entries) { leaderboard = res.entries; game.leaderboard = res.entries; } });
			fetchLeaderboard().then(entries => { if (entries?.length) { leaderboard = entries; game.leaderboard = entries; } });
		}
		if (gameState === 'playing' && prevGameState !== 'playing') {
			scoreSubmitted = false;
			lastBlocksForged = 0;
			// Start a server-side game session for anti-cheat tracking (skip for guests)
			if (!guestMode && wallet?.sessionToken) {
				fetch('/api/game/start-session', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ sessionToken: wallet.sessionToken }),
				})
					.then(r => r.json())
					.then(data => { gameSessionId = data.gameSessionId || null; })
					.catch(() => { gameSessionId = null; });
			}
		}
		prevGameState = gameState;

		animFrameId = requestAnimationFrame(gameLoop);
	}

	const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D']);

	function onKeydown(e) {
		// Start music on any keypress (browser requires user gesture)
		initAudio(); resumeAudio(); startMusic();
		if (walletPhase !== 'ready') return;
		// Prevent page scroll while playing
		if (SCROLL_KEYS.has(e.key)) {
			e.preventDefault();
		}
		if (e.key === 'm' || e.key === 'M') {
			muted = toggleMute();
		}
		handleKeydown(input, e);
	}

	function onKeyup(e) {
		if (walletPhase !== 'ready') return;
		handleKeyup(input, e);
	}

	function onCanvasClick(e) {
		// Start music on first interaction (browsers require user gesture)
		initAudio(); resumeAudio(); startMusic();

		const rect = canvas.getBoundingClientRect();
		const scaleX = CANVAS_W / rect.width;
		const scaleY = CANVAS_H / rect.height;
		const x = (e.clientX - rect.left) * scaleX;
		const y = (e.clientY - rect.top) * scaleY;

		// Game over screen — Tosidrop claim button
		if (game.state === 'gameover') {
			for (const region of gameOverHitRegions) {
				if (x >= region.x && x <= region.x + region.w &&
					y >= region.y && y <= region.y + region.h) {
					if (region.action === 'tosidrop') {
						window.open('https://tosidrop.me/cardano/claim', '_blank');
					}
					return; // don't restart game on button click
				}
			}
		}

		if (walletPhase === 'ready') return; // only handle clicks on wallet connect screen

		for (const region of titleHitRegions) {
			if (x >= region.x && x <= region.x + region.w &&
				y >= region.y && y <= region.y + region.h) {
				if (region.action === 'wallet') {
					onWalletSelect(region.walletId);
				} else if (region.action === 'guest') {
					onGuestStart();
				}
				break;
			}
		}
	}

	function onTouchStart(e) {
		if (walletPhase !== 'ready') return;
		initAudio();
		resumeAudio();
		handleTouchStart(input, canvas, e);

		if (game.state === 'title' || game.state === 'gameover') {
			resetGame(game);
			game.lastTime = performance.now();
			sfxStart();
			startMusic();
		}
	}

	function onTouchMove(e) {
		if (walletPhase !== 'ready') return;
		handleTouchMove(input, e);
	}

	function onTouchEnd(e) {
		if (walletPhase !== 'ready') return;
		handleTouchEnd(input, e);
	}

	async function toggleFullscreen() {
		if (!document.fullscreenElement) {
			await containerEl.requestFullscreen().catch(() => {});
		} else {
			await document.exitFullscreen().catch(() => {});
		}
	}

	function onFullscreenChange() {
		isFullscreen = !!document.fullscreenElement;
	}

	async function onWalletSelect(walletId) {
		selectedWalletId = walletId;
		walletError = '';
		walletPhase = 'connecting';
		try {
			wallet = await connectWallet(walletId, turnstileToken);
			nightMultiplier = wallet.isDelegated ? 10 : 1;
			game.nightMultiplier = nightMultiplier;
			walletPhase = 'ready';
			game.playerName = wallet.adaHandle || truncateStakeAddr(wallet.stakeAddress);
			document.body.style.overflow = 'hidden';
			containerEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			initAudio(); resumeAudio(); startMusic();
			fetchLeaderboard().then(entries => { if (entries?.length) { leaderboard = entries; game.leaderboard = entries; } });
		} catch (e) {
			walletError = e.message || 'Connection failed';
			walletPhase = 'connect';
		}
	}

	function onGuestStart() {
		guestMode = true;
		walletPhase = 'ready';
		nightMultiplier = 0;
		game.nightMultiplier = 0;
		game.guestMode = true;
		game.playerName = 'GUEST';
		document.body.style.overflow = 'hidden';
		containerEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		initAudio(); resumeAudio(); startMusic();
		fetchLeaderboard().then(entries => { if (entries?.length) { leaderboard = entries; game.leaderboard = entries; } });
	}

	function refreshWallets() {
		wallets = detectWallets();
		if (wallets.length > 0) walletsReady = true;
	}

	async function delegateNow() {
		if (!wallet?.api) return;
		delegateStatus = 'Sign in your wallet...';
		try {
			const { default: Delegate } = await import('../../routes/delegate/delegate.js');
			const del = new Delegate(wallet.api);
			await del.delegate(POOL_ID);
			delegateStatus = 'Confirming on-chain...';
			await del.awaitTx();
			delegateStatus = 'Verifying delegation...';
			wallet = await connectWallet(selectedWalletId);
			nightMultiplier = wallet.isDelegated ? 10 : 1;
			game.nightMultiplier = nightMultiplier;
			walletPhase = 'ready';
			game.playerName = wallet.adaHandle || truncateStakeAddr(wallet.stakeAddress);
			delegateStatus = '';
			fetchLeaderboard().then(entries => { if (entries?.length) { leaderboard = entries; game.leaderboard = entries; } });
		} catch (e) {
			if (e?.code === 2) {
				delegateStatus = '';
			} else if (String(e).includes('Insufficient')) {
				delegateStatus = 'Need ~2.5 ADA for delegation deposit + fees';
				setTimeout(() => { delegateStatus = ''; }, 8000);
			} else {
				delegateStatus = e?.message || 'Delegation failed';
				setTimeout(() => { delegateStatus = ''; }, 5000);
			}
		}
	}

	onMount(() => {
		// Scale canvas buffer for high-DPI displays
		const dpr = window.devicePixelRatio || 1;
		canvas.width = CANVAS_W * dpr;
		canvas.height = CANVAS_H * dpr;
		canvas.style.width = CANVAS_W + 'px';
		canvas.style.height = CANVAS_H + 'px';
		ctx = canvas.getContext('2d');
		ctx.scale(dpr, dpr);
		// Wallet extensions inject after page load — retry detection briefly
		refreshWallets();
		setTimeout(refreshWallets, 300);
		setTimeout(() => { refreshWallets(); walletsReady = true; }, 1000);
		fetchLeaderboard().then(entries => { if (entries?.length) { leaderboard = entries; game.leaderboard = entries; } });

		try {
			const saved = localStorage.getItem('starforge-blockforge-highscore');
			if (saved) game.highScore = parseInt(saved, 10) || 0;
		} catch {}

		document.addEventListener('fullscreenchange', onFullscreenChange);
		gameLoop(performance.now());

		// Load Cloudflare Turnstile (if site key is configured)
		fetch('/api/game/turnstile-key').then(r => r.json()).then(data => {
			if (!data.siteKey) { turnstileRequired = false; return; }
			turnstileRequired = true;
			const script = document.createElement('script');
			script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
			script.async = true;
			window.onTurnstileLoad = () => {
				if (turnstileEl) {
					window.turnstile.render(turnstileEl, {
						sitekey: data.siteKey,
						theme: 'dark',
						size: 'compact',
						callback: (token) => { turnstileToken = token; },
					});
				}
			};
			document.head.appendChild(script);
		}).catch(() => {});

		return () => {
			if (animFrameId) cancelAnimationFrame(animFrameId);
			document.removeEventListener('fullscreenchange', onFullscreenChange);
			document.body.style.overflow = '';
		};
	});

	$effect(() => {
		if (game.highScore > 0) {
			try {
				localStorage.setItem('starforge-blockforge-highscore', String(game.highScore));
			} catch {}
		}
	});
</script>

<svelte:window onkeydown={onKeydown} onkeyup={onKeyup} />

<div class="game-container" bind:this={containerEl}>
	{#if walletPhase === 'ready' && wallet && !wallet.isDelegated && gameState === 'title'}
		<div class="boost-banner">
			<div class="boost-text">
				DELEGATE TO STAR FORGE FOR <span class="boost-highlight">10x NIGHT</span> REWARDS
			</div>
			{#if delegateStatus}
				<div class="boost-status">{delegateStatus}</div>
			{:else}
				<div class="boost-btn-row">
					<span class="point-right">👉</span>
					<button class="boost-btn" onclick={delegateNow}>DELEGATE NOW</button>
					<span class="point-left">👈</span>
				</div>
			{/if}
		</div>
	{/if}
	<canvas
		bind:this={canvas}
		width={CANVAS_W}
		height={CANVAS_H}
		onclick={onCanvasClick}
		ontouchstart={onTouchStart}
		ontouchmove={onTouchMove}
		ontouchend={onTouchEnd}
	></canvas>

	<!-- Turnstile (hidden widget, renders above canvas) -->
	<div bind:this={turnstileEl} class="turnstile-widget"></div>

	<button
		class="control-btn mute-btn"
		onclick={() => { initAudio(); muted = toggleMute(); }}
		aria-label={muted ? 'Unmute' : 'Mute'}
	>
		{muted ? '🔇' : '🔊'}
	</button>
	<button
		class="control-btn fullscreen-btn"
		onclick={toggleFullscreen}
		aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
	>
		{isFullscreen ? '⊠' : '⊞'}
	</button>
</div>

<style>
	.game-container {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		position: relative;
		background: #0a0a0a;
	}

	.game-container:fullscreen {
		display: flex;
		justify-content: center;
		align-items: center;
		background: #0a0a0a;
	}

	canvas {
		max-width: 100%;
		max-height: 85vh;
		border: 1px solid rgba(34, 197, 94, 0.2);
		border-radius: 4px;
		touch-action: none;
	}

	.game-container:fullscreen canvas {
		max-height: 100vh;
		max-width: 100vw;
		border: none;
		border-radius: 0;
	}

	.control-btn {
		position: absolute;
		top: 4px;
		background: rgba(0, 0, 0, 0.6);
		border: 1px solid rgba(34, 197, 94, 0.3);
		color: rgba(34, 197, 94, 0.7);
		font-size: 18px;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		border-radius: 3px;
		padding: 0;
		line-height: 1;
		z-index: 10;
		transition: all 0.15s;
	}

	.control-btn:hover {
		color: #4ade80;
		border-color: rgba(34, 197, 94, 0.6);
		background: rgba(0, 0, 0, 0.8);
	}

	.fullscreen-btn {
		right: 4px;
	}

	.mute-btn {
		right: 36px;
		font-size: 14px;
	}

	.turnstile-widget {
		position: absolute;
		top: 36px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 25;
		min-height: 0;
	}


	/* === Delegate boost banner — sits above the canvas === */
	.boost-banner {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 30;
		background: rgba(0, 0, 0, 0.92);
		border: 2px solid rgba(251, 191, 36, 0.4);
		border-radius: 8px;
		padding: 10px 20px;
		text-align: center;
		max-width: 340px;
	}

	.boost-text {
		font: 11px monospace;
		color: #a3a3a3;
		margin-bottom: 8px;
	}

	.boost-highlight {
		color: #fbbf24;
		font-weight: bold;
	}

	.boost-status {
		font: 11px monospace;
		color: #22c55e;
		animation: pulse-text 1s infinite;
	}

	.boost-btn {
		padding: 6px 20px;
		background: rgba(251, 191, 36, 0.15);
		border: 1px solid rgba(251, 191, 36, 0.4);
		border-radius: 4px;
		color: #fbbf24;
		font: bold 12px monospace;
		letter-spacing: 0.1em;
		cursor: pointer;
		transition: all 0.15s;
	}

	.boost-btn:hover {
		background: rgba(251, 191, 36, 0.25);
		border-color: #fbbf24;
	}

	.boost-btn-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 14px;
	}

	.point-right {
		font-size: 20px;
		animation: nudge-right 0.8s ease-in-out infinite;
	}

	.point-left {
		font-size: 20px;
		animation: nudge-left 0.8s ease-in-out infinite;
	}

	@keyframes nudge-right {
		0%, 100% { transform: translateX(0); }
		50% { transform: translateX(6px); }
	}

	@keyframes nudge-left {
		0%, 100% { transform: translateX(0); }
		50% { transform: translateX(-6px); }
	}

	.boost-skip {
		display: block;
		margin: 6px auto 0;
		background: none;
		border: none;
		color: rgba(163, 163, 163, 0.5);
		font: 9px monospace;
		cursor: pointer;
	}

	.boost-skip:hover {
		color: #a3a3a3;
	}


</style>
