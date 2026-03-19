/**
 * Web Audio API sound engine — all sounds are synthesized, no external files.
 * Includes chiptune background melody inspired by southern rock feel +
 * sound effects for every game action.
 */

let ctx = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;
let musicPlaying = false;
let musicTimer = null;
let muted = false;

// Note frequencies
const NOTE = {
	C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, 'F#3': 185.00, G3: 196.00, A3: 220.00, 'Bb3': 233.08, 'B3': 246.94,
	C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, 'F#4': 369.99, G4: 392.00, A4: 440.00, 'Bb4': 466.16, B4: 493.88,
	C5: 523.25, D5: 587.33, E5: 659.26, 'F#5': 739.99,
};

export function initAudio() {
	if (ctx) return;
	ctx = new (window.AudioContext || window.webkitAudioContext)();

	masterGain = ctx.createGain();
	masterGain.gain.value = 1.0;
	masterGain.connect(ctx.destination);

	musicGain = ctx.createGain();
	musicGain.gain.value = 0.4;
	musicGain.connect(masterGain);

	sfxGain = ctx.createGain();
	sfxGain.gain.value = 0.8;
	sfxGain.connect(masterGain);
}

export function resumeAudio() {
	if (ctx && ctx.state === 'suspended') ctx.resume();
}

export function toggleMute() {
	muted = !muted;
	if (masterGain) masterGain.gain.value = muted ? 0 : 1.0;
	return muted;
}

export function isMuted() { return muted; }

// === UTILITY ===

function playTone(freq, duration, type = 'square', gain = 0.3, dest = sfxGain) {
	if (!ctx) return;
	const osc = ctx.createOscillator();
	const g = ctx.createGain();
	osc.type = type;
	osc.frequency.value = freq;
	g.gain.value = gain;
	g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
	osc.connect(g);
	g.connect(dest);
	osc.start(ctx.currentTime);
	osc.stop(ctx.currentTime + duration);
}

function playNoise(duration, gain = 0.2) {
	if (!ctx) return;
	const bufferSize = ctx.sampleRate * duration;
	const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < bufferSize; i++) {
		data[i] = Math.random() * 2 - 1;
	}
	const source = ctx.createBufferSource();
	source.buffer = buffer;
	const g = ctx.createGain();
	g.gain.value = gain;
	g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
	source.connect(g);
	g.connect(sfxGain);
	source.start(ctx.currentTime);
}

// === SOUND EFFECTS ===

/** Shield deflect — metallic ping + electric zap */
export function sfxShieldHit() {
	if (!ctx) return;
	const t = ctx.currentTime;
	// Metallic ping
	const ping = ctx.createOscillator();
	const pg = ctx.createGain();
	ping.type = 'sine';
	ping.frequency.setValueAtTime(1200, t);
	ping.frequency.exponentialRampToValueAtTime(600, t + 0.12);
	pg.gain.setValueAtTime(0.35, t);
	pg.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
	ping.connect(pg);
	pg.connect(sfxGain);
	ping.start(t);
	ping.stop(t + 0.15);
	// Electric zap
	const zap = ctx.createOscillator();
	const zg = ctx.createGain();
	zap.type = 'sawtooth';
	zap.frequency.setValueAtTime(400, t);
	zap.frequency.exponentialRampToValueAtTime(150, t + 0.08);
	zg.gain.setValueAtTime(0.1, t);
	zg.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
	zap.connect(zg);
	zg.connect(sfxGain);
	zap.start(t);
	zap.stop(t + 0.1);
}

export function sfxShieldOn() {
	if (!ctx) return;
	// Magnetic bubble engage — wobbly low hum + resonant pop
	const t = ctx.currentTime;

	// Deep magnetic hum
	const hum = ctx.createOscillator();
	const humGain = ctx.createGain();
	hum.type = 'sine';
	hum.frequency.setValueAtTime(80, t);
	hum.frequency.exponentialRampToValueAtTime(160, t + 0.15);
	hum.frequency.exponentialRampToValueAtTime(120, t + 0.35);
	humGain.gain.setValueAtTime(0.3, t);
	humGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
	hum.connect(humGain);
	humGain.connect(sfxGain);
	hum.start(t);
	hum.stop(t + 0.4);

	// Wobble — fast frequency modulation for magnetic warble
	const wobble = ctx.createOscillator();
	const wobbleGain = ctx.createGain();
	wobble.type = 'sine';
	wobble.frequency.setValueAtTime(300, t);
	wobble.frequency.setValueAtTime(340, t + 0.05);
	wobble.frequency.setValueAtTime(280, t + 0.1);
	wobble.frequency.setValueAtTime(320, t + 0.15);
	wobble.frequency.exponentialRampToValueAtTime(200, t + 0.3);
	wobbleGain.gain.setValueAtTime(0.15, t);
	wobbleGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
	wobble.connect(wobbleGain);
	wobbleGain.connect(sfxGain);
	wobble.start(t);
	wobble.stop(t + 0.35);

	// Bubble pop — short high resonant blip
	const pop = ctx.createOscillator();
	const popGain = ctx.createGain();
	pop.type = 'sine';
	pop.frequency.setValueAtTime(800, t + 0.05);
	pop.frequency.exponentialRampToValueAtTime(200, t + 0.15);
	popGain.gain.setValueAtTime(0, t);
	popGain.gain.setValueAtTime(0.2, t + 0.05);
	popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
	pop.connect(popGain);
	popGain.connect(sfxGain);
	pop.start(t);
	pop.stop(t + 0.2);
}

export function sfxShieldOff() {
	if (!ctx) return;
	// Magnetic bubble collapse — reverse wobble + deflate
	const t = ctx.currentTime;

	const deflate = ctx.createOscillator();
	const g = ctx.createGain();
	deflate.type = 'sine';
	deflate.frequency.setValueAtTime(200, t);
	deflate.frequency.exponentialRampToValueAtTime(60, t + 0.25);
	g.gain.setValueAtTime(0.2, t);
	g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
	deflate.connect(g);
	g.connect(sfxGain);
	deflate.start(t);
	deflate.stop(t + 0.3);

	// Wobble out
	const wobble = ctx.createOscillator();
	const wg = ctx.createGain();
	wobble.type = 'sine';
	wobble.frequency.setValueAtTime(280, t);
	wobble.frequency.setValueAtTime(240, t + 0.05);
	wobble.frequency.setValueAtTime(260, t + 0.1);
	wobble.frequency.exponentialRampToValueAtTime(80, t + 0.2);
	wg.gain.setValueAtTime(0.1, t);
	wg.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
	wobble.connect(wg);
	wg.connect(sfxGain);
	wobble.start(t);
	wobble.stop(t + 0.25);
}

/** Rear impact jams shield — heavy crunch + electric fizzle */
export function sfxShieldJam() {
	if (!ctx) return;
	// Metal crunch
	playNoise(0.3, 0.4);
	// Low impact thud
	playTone(50, 0.25, 'square', 0.3);
	// Electric fizzle — descending saw
	setTimeout(() => {
		if (!ctx) return;
		const osc = ctx.createOscillator();
		const g = ctx.createGain();
		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(1200, ctx.currentTime);
		osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.4);
		g.gain.value = 0.2;
		g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
		osc.connect(g);
		g.connect(sfxGain);
		osc.start(ctx.currentTime);
		osc.stop(ctx.currentTime + 0.45);
	}, 50);
	// Sparking crackle
	setTimeout(() => playNoise(0.15, 0.15), 200);
	setTimeout(() => playNoise(0.1, 0.1), 350);
}

export function sfxEmp() {
	if (!ctx) return;
	const t = ctx.currentTime;

	// Layer 1: Massive initial CRACK — bright noise burst
	playNoise(0.15, 0.5);

	// Layer 2: Sub-bass earthquake thump (30 Hz, long decay)
	const sub = ctx.createOscillator();
	const subG = ctx.createGain();
	sub.type = 'sine';
	sub.frequency.setValueAtTime(35, t);
	sub.frequency.exponentialRampToValueAtTime(18, t + 0.8);
	subG.gain.setValueAtTime(0.35, t);
	subG.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
	sub.connect(subG);
	subG.connect(sfxGain);
	sub.start(t);
	sub.stop(t + 0.9);

	// Layer 3: Descending sawtooth screech (the "pulse" sweep)
	const sweep = ctx.createOscillator();
	const sweepG = ctx.createGain();
	sweep.type = 'sawtooth';
	sweep.frequency.setValueAtTime(2400, t);
	sweep.frequency.exponentialRampToValueAtTime(30, t + 0.7);
	sweepG.gain.setValueAtTime(0.2, t);
	sweepG.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
	sweep.connect(sweepG);
	sweepG.connect(sfxGain);
	sweep.start(t);
	sweep.stop(t + 0.7);

	// Layer 4: Square wave mid-range punch
	const punch = ctx.createOscillator();
	const punchG = ctx.createGain();
	punch.type = 'square';
	punch.frequency.setValueAtTime(600, t);
	punch.frequency.exponentialRampToValueAtTime(40, t + 0.5);
	punchG.gain.setValueAtTime(0.18, t);
	punchG.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
	punch.connect(punchG);
	punchG.connect(sfxGain);
	punch.start(t);
	punch.stop(t + 0.5);

	// Layer 5: High-frequency crackle tail (delayed)
	setTimeout(() => {
		if (!ctx) return;
		playNoise(0.2, 0.15);
		playNoise(0.12, 0.08);
	}, 150);

	// Layer 6: Resonant "power down" hum tail
	setTimeout(() => {
		if (!ctx) return;
		const hum = ctx.createOscillator();
		const humG = ctx.createGain();
		hum.type = 'triangle';
		hum.frequency.setValueAtTime(120, ctx.currentTime);
		hum.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.6);
		humG.gain.setValueAtTime(0.12, ctx.currentTime);
		humG.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
		hum.connect(humG);
		humG.connect(sfxGain);
		hum.start(ctx.currentTime);
		hum.stop(ctx.currentTime + 0.6);
	}, 300);

	// Layer 7: Secondary crackle at 400ms
	setTimeout(() => {
		if (!ctx) return;
		playNoise(0.08, 0.06);
	}, 400);
}

export function sfxExplosion() {
	if (!ctx) return;
	// Bigger boom — noise burst + bass + crackle tail
	playNoise(0.3, 0.35);
	playTone(60, 0.25, 'square', 0.2);
	playTone(45, 0.15, 'sine', 0.15);
	setTimeout(() => playNoise(0.15, 0.12), 100);
	setTimeout(() => playNoise(0.1, 0.06), 200);
}

export function sfxDelegator() {
	if (!ctx) return;
	// Happy ascending chime — brighter with shimmer
	playTone(NOTE.E4, 0.12, 'square', 0.15);
	setTimeout(() => playTone(NOTE.A4, 0.12, 'square', 0.15), 60);
	setTimeout(() => playTone(NOTE.D5, 0.25, 'triangle', 0.22), 120);
	setTimeout(() => playTone(NOTE.E5, 0.15, 'sine', 0.08), 200); // shimmer
}

export function sfxForgeSuccess() {
	if (!ctx) return;
	const t = ctx.currentTime;

	// === HAMMER ON STEEL — sharp metallic anvil strike ===

	// Layer 1: Impact noise burst (hammer contact)
	playNoise(0.08, 0.45);

	// Layer 2: High metallic ring (steel resonance)
	const ring = ctx.createOscillator();
	const ringG = ctx.createGain();
	ring.type = 'sine';
	ring.frequency.setValueAtTime(1800, t);
	ring.frequency.exponentialRampToValueAtTime(900, t + 0.6);
	ringG.gain.setValueAtTime(0.3, t);
	ringG.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
	ring.connect(ringG);
	ringG.connect(sfxGain);
	ring.start(t);
	ring.stop(t + 0.7);

	// Layer 3: Second harmonic ring (overtone)
	const ring2 = ctx.createOscillator();
	const ring2G = ctx.createGain();
	ring2.type = 'sine';
	ring2.frequency.setValueAtTime(3200, t);
	ring2.frequency.exponentialRampToValueAtTime(1600, t + 0.4);
	ring2G.gain.setValueAtTime(0.12, t);
	ring2G.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
	ring2.connect(ring2G);
	ring2G.connect(sfxGain);
	ring2.start(t);
	ring2.stop(t + 0.5);

	// Layer 4: Heavy anvil thud (weight of the strike)
	const anvil = ctx.createOscillator();
	const anvilG = ctx.createGain();
	anvil.type = 'square';
	anvil.frequency.setValueAtTime(120, t);
	anvil.frequency.exponentialRampToValueAtTime(40, t + 0.25);
	anvilG.gain.setValueAtTime(0.25, t);
	anvilG.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
	anvil.connect(anvilG);
	anvilG.connect(sfxGain);
	anvil.start(t);
	anvil.stop(t + 0.3);

	// Layer 5: Metallic shimmer tail (ringing steel fading)
	setTimeout(() => {
		if (!ctx) return;
		const shimmer = ctx.createOscillator();
		const sg = ctx.createGain();
		shimmer.type = 'sine';
		shimmer.frequency.setValueAtTime(2400, ctx.currentTime);
		shimmer.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.5);
		sg.gain.setValueAtTime(0.08, ctx.currentTime);
		sg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
		shimmer.connect(sg);
		sg.connect(sfxGain);
		shimmer.start(ctx.currentTime);
		shimmer.stop(ctx.currentTime + 0.6);
	}, 100);

	// === HEAVENLY CHOIR — stacked sine "ahhh" with vibrato ===
	setTimeout(() => {
		if (!ctx) return;
		const now = ctx.currentTime;
		const choirDuration = 2.5;
		const fadeIn = 0.3;

		// Choir voices — D major chord spread across octaves with slight detune
		const voices = [
			{ freq: NOTE.D4, detune: -3, gain: 0.08 },   // root
			{ freq: NOTE['F#4'], detune: 2, gain: 0.07 }, // major third
			{ freq: NOTE.A4, detune: -2, gain: 0.07 },    // fifth
			{ freq: NOTE.D5, detune: 3, gain: 0.06 },     // octave
			{ freq: NOTE['F#5'], detune: -4, gain: 0.05 }, // high third
			{ freq: NOTE.A3, detune: 1, gain: 0.06 },     // low fifth (depth)
		];

		for (const v of voices) {
			// Main voice
			const osc = ctx.createOscillator();
			const g = ctx.createGain();
			osc.type = 'sine';
			osc.frequency.value = v.freq + v.detune;
			// Slow vibrato for human quality
			const lfo = ctx.createOscillator();
			const lfoG = ctx.createGain();
			lfo.type = 'sine';
			lfo.frequency.value = 4.5 + Math.random() * 1.5; // 4.5-6 Hz vibrato
			lfoG.gain.value = 3; // subtle pitch wobble
			lfo.connect(lfoG);
			lfoG.connect(osc.frequency);
			// Fade in, sustain, fade out
			g.gain.setValueAtTime(0, now);
			g.gain.linearRampToValueAtTime(v.gain, now + fadeIn);
			g.gain.setValueAtTime(v.gain, now + choirDuration - 0.8);
			g.gain.exponentialRampToValueAtTime(0.001, now + choirDuration);
			osc.connect(g);
			g.connect(sfxGain);
			osc.start(now);
			osc.stop(now + choirDuration);
			lfo.start(now);
			lfo.stop(now + choirDuration);

			// Breathy layer — triangle wave at same freq for warmth
			const breath = ctx.createOscillator();
			const bg = ctx.createGain();
			breath.type = 'triangle';
			breath.frequency.value = v.freq + v.detune + 1;
			bg.gain.setValueAtTime(0, now);
			bg.gain.linearRampToValueAtTime(v.gain * 0.4, now + fadeIn);
			bg.gain.setValueAtTime(v.gain * 0.4, now + choirDuration - 0.8);
			bg.gain.exponentialRampToValueAtTime(0.001, now + choirDuration);
			breath.connect(bg);
			bg.connect(sfxGain);
			breath.start(now);
			breath.stop(now + choirDuration);
		}
	}, 400);
}

/** Forge misfire — harsh error buzz for pressing F outside window */
export function sfxForgeMisfire() {
	if (!ctx) return;
	const t = ctx.currentTime;
	// Harsh buzz — square wave at dissonant frequency
	const buzz = ctx.createOscillator();
	const bg = ctx.createGain();
	buzz.type = 'square';
	buzz.frequency.setValueAtTime(90, t);
	buzz.frequency.setValueAtTime(85, t + 0.05);
	buzz.frequency.setValueAtTime(90, t + 0.1);
	bg.gain.setValueAtTime(0.25, t);
	bg.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
	buzz.connect(bg);
	bg.connect(sfxGain);
	buzz.start(t);
	buzz.stop(t + 0.2);
	// Static crackle
	playNoise(0.1, 0.15);
}

export function sfxForgeMiss() {
	if (!ctx) return;
	// Descending failure — heavier
	playTone(NOTE.A3, 0.2, 'square', 0.15);
	setTimeout(() => playTone(NOTE.E3, 0.35, 'square', 0.15), 100);
	setTimeout(() => playTone(NOTE.D3, 0.3, 'triangle', 0.1), 250);
}

export function sfxPlayerHit() {
	if (!ctx) return;
	// Crunch + alarm tone
	playNoise(0.2, 0.35);
	playTone(120, 0.2, 'square', 0.25);
	setTimeout(() => playTone(200, 0.1, 'sawtooth', 0.1), 80);
}

export function sfxPowerup() {
	if (!ctx) return;
	// Sparkly ascending arpeggio
	playTone(NOTE.C4, 0.1, 'square', 0.14);
	setTimeout(() => playTone(NOTE.E4, 0.1, 'square', 0.14), 50);
	setTimeout(() => playTone(NOTE.G4, 0.1, 'square', 0.14), 100);
	setTimeout(() => playTone(NOTE.C5, 0.18, 'triangle', 0.18), 150);
	setTimeout(() => playTone(NOTE.E5, 0.12, 'sine', 0.06), 220); // sparkle
}

export function sfxDump() {
	if (!ctx) return;
	// Splatty dump sound
	playTone(50, 0.2, 'sawtooth', 0.15);
	playNoise(0.12, 0.1);
	setTimeout(() => playTone(40, 0.1, 'square', 0.08), 60);
}

export function sfxEnemyShot() {
	if (!ctx) return;
	// Sharp laser pew
	playTone(1100, 0.04, 'square', 0.1);
	setTimeout(() => playTone(700, 0.06, 'square', 0.08), 20);
	setTimeout(() => playTone(400, 0.04, 'square', 0.04), 40);
}

export function sfxGameOver() {
	if (!ctx) return;
	// Power-down sequence — descending with static
	const notes = [NOTE.D4, NOTE.B3, NOTE.A3, NOTE.E3, NOTE.D3, NOTE.C3];
	notes.forEach((n, i) => {
		setTimeout(() => {
			playTone(n, 0.4, 'triangle', 0.18);
			if (i > 2) playNoise(0.1, 0.05); // static crackle on low notes
		}, i * 220);
	});
	// Final power-down hum
	setTimeout(() => playTone(NOTE.C3, 0.8, 'sine', 0.12), notes.length * 220);
}

export function sfxStart() {
	if (!ctx) return;
	// Engine ignition — ascending power chord
	const notes = [NOTE.D3, NOTE.A3, NOTE.D4, NOTE['F#4'], NOTE.A4];
	notes.forEach((n, i) => {
		setTimeout(() => playTone(n, 0.15, 'square', 0.14), i * 55);
	});
	// Top note with shimmer
	setTimeout(() => {
		playTone(NOTE.D5, 0.25, 'triangle', 0.12);
		playNoise(0.05, 0.08); // engine catch
	}, notes.length * 55);
}

// === BACKGROUND MUSIC — Midnight Rider MP3 (MIDI renditions, alternating) ===

const TRACKS = [
	'/assets/audio/midnight-rider-3.mp3',
	'/assets/audio/midnight-rider-1.mp3',
	'/assets/audio/midnight-rider-2.mp3',
];
let trackIndex = 0;
let musicEl = null;
let musicSource = null;

function createMusicEl(src) {
	const el = new Audio(src);
	el.loop = false;
	el.volume = 1.0;

	// Route through Web Audio graph for master mute
	if (ctx) {
		const source = ctx.createMediaElementSource(el);
		source.connect(musicGain);
	}

	// When track ends, play the next one
	el.addEventListener('ended', () => {
		if (!musicPlaying) return;
		trackIndex = (trackIndex + 1) % TRACKS.length;
		musicEl = createMusicEl(TRACKS[trackIndex]);
		musicEl.play().catch(() => {});
	});

	return el;
}

export function startMusic() {
	if (!ctx) return;
	if (musicPlaying && musicEl && !musicEl.paused) return;
	musicPlaying = true;
	if (!musicEl) {
		trackIndex = 0;
		musicEl = createMusicEl(TRACKS[trackIndex]);
	}
	if (ctx.state === 'suspended') {
		ctx.resume().then(() => {
			musicEl.play().catch(() => {});
		});
	} else {
		musicEl.play().catch(() => {});
	}
}

export function stopMusic() {
	musicPlaying = false;
	if (musicEl) {
		musicEl.pause();
		musicEl = null;
	}
}
