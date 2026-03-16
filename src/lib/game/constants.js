// Canvas
export const CANVAS_W = 480;
export const CANVAS_H = 720;

// Road geometry
export const ROAD_LEFT = 90;
export const ROAD_RIGHT = 390;
export const ROAD_W = ROAD_RIGHT - ROAD_LEFT;
export const LANE_COUNT = 4;
export const LANE_W = ROAD_W / LANE_COUNT;
export const STRIPE_H = 40;
export const STRIPE_GAP = 30;

// Player (RV)
export const RV_W = 44;
export const RV_H = 72;
export const PLAYER_SPEED = 4;

// Battery
export const BATTERY_MAX = 1000;
export const BATTERY_START = 700;
export const SOLAR_REGEN_RATE = 0.2; // per frame
export const SOLAR_BOOST_RATE = 1.0; // per frame (5x normal)
export const SOLAR_BOOST_DURATION = 6000; // ms
export const BATTERY_PACK_RESTORE = 150;

// EM Shield (primary weapon) — tight field around RV
export const SHIELD_DRAIN_PER_FRAME = 0.7; // ~42/sec
export const SHIELD_CUTOFF = 30; // auto-off below this
export const SHIELD_RADIUS = 48; // snug around the RV body

// EMP Blast (secondary weapon) — 3-lane area pulse
export const EMP_DRAIN = 150; // heavy single-use cost
export const EMP_COOLDOWN = 4000; // ms
export const EMP_RADIUS = LANE_W * 1.5; // ~3 lane coverage
export const EMP_FLASH_DURATION = 400; // ms

// Black tank
export const BLACK_TANK_DRAIN_PER_FRAME = 0.6; // ~36/sec while holding
export const BLACK_TANK_SEGMENT_INTERVAL = 50; // ms between trail segments
export const BLACK_TANK_SEGMENT_LIFE = 3000; // ms each segment persists
export const BLACK_TANK_W = LANE_W; // one lane wide, sweep to cover more

// Block forging
export const BLOCK_INTERVAL_BASE = 45; // seconds
export const BLOCK_INTERVAL_MIN = 15; // seconds
export const BLOCK_INTERVAL_DECAY = 0.92; // multiplier per block
export const BLOCK_FORGE_DRAIN = 15;
export const BLOCK_FORGE_WINDOW = 1000; // ms — time to press F
export const BLOCK_REWARD_POINTS = 500;
export const BLOCK_REWARD_GROWTH = 100; // +per consecutive block
export const NIGHT_PER_BLOCK = 1;

// Enemies
export const ENEMY_TYPES = {
	fec: {
		name: 'FEC',
		w: 34, h: 52,
		color: '#1e3a5f', accent: '#152d4a', badge: '#fbbf24',
		speedMult: 0.7, hp: 1, points: 75,
		minDistance: 0,
	},
	iog: {
		name: 'IOG',
		w: 38, h: 56,
		color: '#e5e5e5', accent: '#a3a3a3', badge: '#ef4444',
		speedMult: 0.6, hp: 1, points: 60,
		minDistance: 0,
	},
	cf: {
		name: 'CF',
		w: 34, h: 52,
		color: '#1e40af', accent: '#1e3a8a', badge: '#3b82f6',
		speedMult: 0.7, hp: 1, points: 60,
		minDistance: 3000,
	},
	emurgo: {
		name: 'EMURGO',
		w: 34, h: 52,
		color: '#7e22ce', accent: '#6b21a8', badge: '#a855f7',
		speedMult: 0.7, hp: 1, points: 60,
		minDistance: 3000,
	},
	federal: {
		name: 'FED',
		w: 40, h: 58,
		color: '#171717', accent: '#0a0a0a', badge: '#dc2626',
		speedMult: 0.6, hp: 2, points: 100,
		minDistance: 3000,
	},
	multipool: {
		name: 'MPO',
		w: 48, h: 64,
		color: '#166534', accent: '#14532d', badge: '#4ade80',
		speedMult: 0.35, hp: 3, points: 150,
		minDistance: 6000,
	},
};

export const SPAWN_INTERVAL_MIN = 800; // ms
export const SPAWN_INTERVAL_MAX = 2200; // ms
export const PURSUER_DISTANCE = 5000; // distance before pursuers appear
export const PURSUER_CHANCE = 0.15;
export const PURSUER_SPEED_MULT = 0.8; // pursuers creep up slowly from behind

// Enemy bullets (pursuers fire at player)
export const ENEMY_BULLET_SPEED = 4;
export const ENEMY_BULLET_W = 4;
export const ENEMY_BULLET_H = 10;
export const ENEMY_FIRE_INTERVAL = 2000; // ms between shots
export const ENEMY_BULLET_DAMAGE = 1; // lives lost per hit

// Delegators / hitchhikers
export const DELEGATOR_CHANCE = 0.02; // per spawn cycle
export const DELEGATOR_W = 16;
export const DELEGATOR_H = 16;
export const DELEGATOR_FORGE_BONUS = 0.06; // 6% faster forge per delegator

// Powerups (no EMP in pool — it's a weapon now)
export const POWERUP_CHANCE = 0.03;
export const POWERUP_W = 24;
export const POWERUP_H = 24;

// Road speed — constant, no ramp
export const ROAD_SPEED = 3;

// Colors — cockpit HUD theme
export const COLOR = {
	bg: '#0a0a0a',
	grass: '#0d1a0d',
	grassStripe: '#0f1f0f',
	grassLight: '#132613',
	road: '#1a1a1a',
	roadDark: '#141414',
	roadEdge: '#22c55e33',
	stripe: '#22c55e55',
	rumble: '#fbbf2466',

	// Player RV — tan/cream motorhome
	rv: '#d4b896',
	rvAccent: '#b89a78',
	rvDark: '#8c7560',
	rvWindshield: '#4a90c2',
	rvSolar: '#2a4a6a',
	rvStarlink: '#e5e5e5',
	rvRoof: '#e8ddd0',

	// Weapons
	tankSlick: '#5c4033',
	tankBubble: '#6b8e23',
	shieldGlow: '#06b6d444',
	shieldStroke: '#06b6d4',
	empFlash: '#a855f7',

	// Shield color cycle (shifts while active)
	shieldColors: ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444'],

	// Effects
	explosion: ['#fbbf24', '#f97316', '#ef4444', '#dc2626'],

	// HUD
	text: '#22c55e',
	textDim: '#22c55e88',
	textBright: '#4ade80',
	tan: '#d4a574',
	cyan: '#06b6d4',
	amber: '#fbbf24',
	red: '#ef4444',
	white: '#ffffff',
	forgeFlash: '#4ade80',
};
