<script>
	import { onMount } from 'svelte';
	import { CANVAS_W, CANVAS_H } from '$lib/game/constants.js';
	import { createGame, resetGame, tick, render } from '$lib/game/engine.js';
	import { createInput, handleKeydown, handleKeyup, handleTouchStart, handleTouchMove, handleTouchEnd } from '$lib/game/input.js';
	import { initAudio, resumeAudio, toggleMute, isMuted, startMusic, stopMusic, sfxStart } from '$lib/game/audio.js';
	import { detectWallets, connectWallet, submitScore, fetchLeaderboard } from '$lib/game/wallet.js';
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
	let gameSessionId = null;
	let turnstileToken = $state('');
	let turnstileRequired = $state(false);
	let turnstileEl;

	function gameLoop(timestamp) {
		const now = timestamp || performance.now();

		tick(game, input, now);
		render(ctx, game, now);

		gameState = game.state;
		score = game.score;
		blocksForged = game.forge.blocksForged;
		nightEarned = game.forge.nightEarned;

		// Deliver NIGHT tokens on block forge — server determines amount based on delegation
		if (game.forge.blocksForged > lastBlocksForged && wallet?.sessionToken && gameSessionId) {
			lastBlocksForged = game.forge.blocksForged;
			fetch('/api/game/deliver-reward', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionToken: wallet.sessionToken, gameSessionId }),
			}).catch(() => {});
		}

		// Submit score on game over transition
		if (gameState === 'gameover' && prevGameState !== 'gameover' && wallet && !scoreSubmitted) {
			scoreSubmitted = true;
			const displayName = wallet.adaHandle || wallet.stakeAddress.slice(0, 15) + '...';
			submitScore(wallet.sessionToken, displayName, game.score, game.forge.blocksForged, game.forge.nightEarned)
				.then(res => { if (res?.entries) { leaderboard = res.entries; game.leaderboard = res.entries; } });
			fetchLeaderboard().then(entries => { if (entries?.length) { leaderboard = entries; game.leaderboard = entries; } });
		}
		if (gameState === 'playing' && prevGameState !== 'playing') {
			scoreSubmitted = false;
			lastBlocksForged = 0;
			// Start a server-side game session for anti-cheat tracking
			if (wallet?.sessionToken) {
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
		if (walletPhase !== 'ready') return;
		// Prevent page scroll while playing
		if (SCROLL_KEYS.has(e.key)) {
			e.preventDefault();
		}
		initAudio();
		resumeAudio();
		if (e.key === 'm' || e.key === 'M') {
			muted = toggleMute();
		}
		handleKeydown(input, e);
	}

	function onKeyup(e) {
		if (walletPhase !== 'ready') return;
		handleKeyup(input, e);
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
			game.playerName = wallet.adaHandle || `...${wallet.stakeAddress.slice(-4)}`;
			document.body.style.overflow = 'hidden';
			containerEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			initAudio(); resumeAudio(); startMusic();
			fetchLeaderboard().then(entries => { if (entries?.length) { leaderboard = entries; game.leaderboard = entries; } });
		} catch (e) {
			walletError = e.message || 'Connection failed';
			walletPhase = 'connect';
		}
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
			game.playerName = wallet.adaHandle || `...${wallet.stakeAddress.slice(-4)}`;
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
	<canvas
		bind:this={canvas}
		width={CANVAS_W}
		height={CANVAS_H}
		ontouchstart={onTouchStart}
		ontouchmove={onTouchMove}
		ontouchend={onTouchEnd}
	></canvas>

	{#if walletPhase !== 'ready'}
		<div class="wallet-overlay">
			<div class="wallet-box">
				<h2 class="wallet-title">CONNECT WALLET</h2>
				<p class="wallet-sub">Delegate to Star Forge [OTG] for 10x NIGHT rewards</p>

				{#if walletPhase === 'connecting'}
					<div class="wallet-status">Connecting...</div>
				{:else}
					<div bind:this={turnstileEl} class="turnstile-widget"></div>
					{#if walletError}
						<div class="wallet-error">{walletError}</div>
					{/if}
					{#if !walletsReady}
						<div class="wallet-status">Detecting wallets...</div>
					{:else if wallets.length === 0}
						<div class="wallet-empty">
							No CIP-30 wallets detected.<br />
							Install Eternl, Lace, or Yoroi.
						</div>
					{:else}
						<div class="wallet-list">
							{#each wallets as w}
								<button class="wallet-item" onclick={() => onWalletSelect(w.id)}>
									<img src={w.icon} alt={w.name} class="wallet-icon" />
									<span>{w.name}</span>
								</button>
							{/each}
						</div>
					{/if}
				{/if}
			</div>

				<div class="leaderboard-box">
					<h3 class="lb-title">TOP 10</h3>
					{#if leaderboard.length > 0}
						<div class="lb-header">
							<span class="lb-rank"></span>
							<span class="lb-name">PLAYER</span>
							<span class="lb-stat">SCORE</span>
							<span class="lb-stat">NIGHT</span>
						</div>
						<div class="lb-list">
							{#each leaderboard.slice(0, 10) as entry, i}
								<div class="lb-row">
									<span class="lb-rank">{i + 1}.</span>
									<span class="lb-name">{entry.displayName}</span>
									<span class="lb-stat">{entry.score?.toLocaleString()}</span>
									<span class="lb-stat lb-night">{entry.nightEarned || 0}</span>
								</div>
							{/each}
						</div>
					{:else}
						<div class="lb-empty">No scores yet. Be the first!</div>
					{/if}
				</div>
		</div>
	{/if}

	{#if walletPhase === 'ready' && wallet}
		<div class="wallet-badge">
			{wallet.adaHandle || `...${wallet.stakeAddress.slice(-4)}`}
			{#if nightMultiplier > 1}
				<span class="badge-mult">10x</span>
			{/if}
		</div>
		{#if !wallet.isDelegated && gameState === 'title'}
			<div class="boost-banner">
				<div class="boost-text">
					DELEGATE TO STAR FORGE FOR <span class="boost-highlight">10x NIGHT</span> REWARDS
				</div>
				{#if delegateStatus}
					<div class="boost-status">{delegateStatus}</div>
				{:else}
					<button class="boost-btn" onclick={delegateNow}>DELEGATE NOW</button>
				{/if}
				<button class="boost-skip" onclick={() => { /* just play */ }}>
					PLAY AT 1x
				</button>
			</div>
		{/if}
	{/if}

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

	/* === Wallet Overlay === */
	.wallet-overlay {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.92);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		z-index: 20;
		gap: 20px;
		padding: 20px;
	}

	.wallet-box {
		text-align: center;
		max-width: 340px;
	}

	.wallet-title {
		font: bold 22px monospace;
		color: #d4a574;
		letter-spacing: 0.15em;
		margin: 0 0 6px;
	}

	.wallet-sub {
		font: 11px monospace;
		color: rgba(34, 197, 94, 0.5);
		margin: 0 0 20px;
	}

	.turnstile-widget {
		display: flex;
		justify-content: center;
		margin-bottom: 12px;
		min-height: 0;
	}

	.wallet-status {
		font: 13px monospace;
		color: #22c55e;
		animation: pulse-text 1s infinite;
	}

	@keyframes pulse-text {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.4; }
	}

	.wallet-error {
		font: 11px monospace;
		color: #ef4444;
		margin-bottom: 12px;
		padding: 6px 10px;
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 4px;
		background: rgba(239, 68, 68, 0.1);
	}

	.wallet-empty {
		font: 11px monospace;
		color: rgba(34, 197, 94, 0.5);
		line-height: 1.6;
	}

	.wallet-list {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		justify-content: center;
	}

	.wallet-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 14px;
		background: rgba(34, 197, 94, 0.08);
		border: 1px solid rgba(34, 197, 94, 0.25);
		border-radius: 6px;
		color: #4ade80;
		font: bold 12px monospace;
		cursor: pointer;
		transition: all 0.15s;
	}

	.wallet-item:hover {
		background: rgba(34, 197, 94, 0.18);
		border-color: rgba(34, 197, 94, 0.5);
		color: #86efac;
	}

	.wallet-icon {
		width: 24px;
		height: 24px;
		border-radius: 4px;
	}


	/* === Wallet Badge (in-game) === */
	.wallet-badge {
		position: absolute;
		top: 4px;
		left: 4px;
		background: rgba(0, 0, 0, 0.6);
		border: 1px solid rgba(34, 197, 94, 0.2);
		border-radius: 3px;
		padding: 2px 8px;
		font: bold 10px monospace;
		color: #4ade80;
		z-index: 10;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.badge-mult {
		background: rgba(251, 191, 36, 0.2);
		border: 1px solid rgba(251, 191, 36, 0.4);
		border-radius: 2px;
		padding: 0 4px;
		color: #fbbf24;
		font: bold 9px monospace;
	}

	/* === Delegate boost banner === */
	.boost-banner {
		position: absolute;
		bottom: 36px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(0, 0, 0, 0.85);
		border: 1px solid rgba(251, 191, 36, 0.3);
		border-radius: 6px;
		padding: 10px 16px;
		text-align: center;
		z-index: 15;
		max-width: 320px;
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

	/* === Leaderboard === */
	.leaderboard-box {
		max-width: 340px;
		width: 100%;
	}

	.lb-title {
		font: bold 13px monospace;
		color: #d4a574;
		letter-spacing: 0.15em;
		text-align: center;
		margin: 0 0 8px;
	}

	.lb-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.lb-row {
		display: flex;
		align-items: center;
		padding: 3px 8px;
		background: rgba(34, 197, 94, 0.04);
		border-radius: 3px;
		font: 11px monospace;
	}

	.lb-rank {
		color: #d4a574;
		width: 28px;
		flex-shrink: 0;
	}

	.lb-name {
		color: rgba(34, 197, 94, 0.7);
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.lb-header {
		display: flex;
		align-items: center;
		padding: 0 8px 4px;
		font: bold 9px monospace;
		color: rgba(34, 197, 94, 0.4);
		letter-spacing: 0.1em;
	}

	.lb-stat {
		color: #4ade80;
		font-weight: bold;
		width: 60px;
		text-align: right;
		flex-shrink: 0;
	}

	.lb-night {
		color: #d4a574;
	}

	.lb-empty {
		font: 11px monospace;
		color: rgba(34, 197, 94, 0.4);
		text-align: center;
		padding: 8px;
	}

</style>
