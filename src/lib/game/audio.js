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
	// Heavy zap with bass thud
	playNoise(0.35, 0.35);
	playTone(40, 0.15, 'sine', 0.25); // sub-bass thump
	const osc = ctx.createOscillator();
	const osc2 = ctx.createOscillator();
	const g = ctx.createGain();
	osc.type = 'sawtooth';
	osc2.type = 'square';
	osc.frequency.setValueAtTime(900, ctx.currentTime);
	osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.35);
	osc2.frequency.setValueAtTime(450, ctx.currentTime);
	osc2.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.35);
	g.gain.value = 0.25;
	g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
	osc.connect(g);
	osc2.connect(g);
	g.connect(sfxGain);
	osc.start(ctx.currentTime);
	osc.stop(ctx.currentTime + 0.4);
	osc2.start(ctx.currentTime);
	osc2.stop(ctx.currentTime + 0.4);
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
	// Triumphant chord into KABOOM + earthquake rumble
	playTone(NOTE.D4, 0.3, 'square', 0.14);
	playTone(NOTE['F#4'], 0.3, 'square', 0.14);
	playTone(NOTE.A4, 0.3, 'square', 0.14);
	// Kaboom — heavy noise burst + sub-bass
	setTimeout(() => {
		playNoise(0.4, 0.4);
		playTone(30, 0.5, 'sine', 0.35); // sub-bass thud
		playTone(55, 0.4, 'square', 0.2); // bass crunch
	}, 150);
	// Earthquake rumble — low oscillation
	setTimeout(() => {
		if (!ctx) return;
		const osc = ctx.createOscillator();
		const g = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(25, ctx.currentTime);
		osc.frequency.linearRampToValueAtTime(15, ctx.currentTime + 0.6);
		g.gain.value = 0.3;
		g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
		osc.connect(g);
		g.connect(sfxGain);
		osc.start(ctx.currentTime);
		osc.stop(ctx.currentTime + 0.7);
		// Crumble debris
		playNoise(0.25, 0.15);
	}, 300);
	// Aftershock
	setTimeout(() => playTone(20, 0.3, 'sine', 0.12), 600);
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
	if (musicPlaying) return;
	musicPlaying = true;
	trackIndex = 0;
	musicEl = createMusicEl(TRACKS[trackIndex]);
	musicEl.currentTime = 0;
	musicEl.play().catch(() => {});
}

export function stopMusic() {
	musicPlaying = false;
	if (musicEl) {
		musicEl.pause();
		musicEl = null;
	}
}
