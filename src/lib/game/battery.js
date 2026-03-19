import {
	BATTERY_MAX, BATTERY_START, SOLAR_REGEN_RATE, SOLAR_BOOST_RATE,
	SHIELD_CUTOFF,
} from './constants.js';

export function createBattery() {
	return {
		level: BATTERY_START,
		solarBoostUntil: 0,
	};
}

export function updateBattery(battery, now) {
	const rate = now < battery.solarBoostUntil ? SOLAR_BOOST_RATE : SOLAR_REGEN_RATE;
	battery.level = Math.min(BATTERY_MAX, battery.level + rate);
}

/** Attempt to drain. Returns true if sufficient energy. */
export function drain(battery, amount) {
	if (battery.level < amount) return false;
	battery.level -= amount;
	return true;
}

/** Force drain — always takes energy, clamps to 0. For penalties. */
export function forceDrain(battery, amount) {
	battery.level = Math.max(0, battery.level - amount);
}

export function isDead(battery) {
	return battery.level <= 0;
}

export function canShield(battery) {
	return battery.level > SHIELD_CUTOFF;
}

export function getPercent(battery) {
	return Math.round((battery.level / BATTERY_MAX) * 100);
}

export function activateSolarBoost(battery, now, duration) {
	battery.solarBoostUntil = now + duration;
}

export function addCharge(battery, amount) {
	battery.level = Math.min(BATTERY_MAX, battery.level + amount);
}
