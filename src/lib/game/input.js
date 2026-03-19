import { ROAD_LEFT, ROAD_RIGHT, CANVAS_W, CANVAS_H } from './constants.js';

export function createInput() {
	return {
		keys: {},
		touchStartX: null,
		touchCurrentX: null,
		isTouchEmp: false,
		isTouchDumping: false,
		isTouchShielding: false,
		isTouchForging: false,
	};
}

// Keys that should preventDefault
const PREVENT = new Set([' ', 'Shift', 'q', 'Q', 'e', 'E', 'f', 'F']);

export function handleKeydown(input, e) {
	input.keys[e.key] = true;
	if (PREVENT.has(e.key)) e.preventDefault();
}

export function handleKeyup(input, e) {
	input.keys[e.key] = false;
}

export function handleTouchStart(input, canvas, e) {
	e.preventDefault();
	const rect = canvas.getBoundingClientRect();
	const scaleX = CANVAS_W / rect.width;
	const scaleY = CANVAS_H / rect.height;

	// Process all active touches
	for (const touch of e.changedTouches) {
		const x = touch.clientX - rect.left;
		const y = touch.clientY - rect.top;
		const canvasX = x * scaleX;
		const canvasY = y * scaleY;

		// Left shoulder buttons (x < ROAD_LEFT)
		if (canvasX < ROAD_LEFT) {
			const midY = CANVAS_H / 2;
			if (canvasY < midY) {
				input.isTouchDumping = true;    // Top-left: DUMP
			} else {
				input.isTouchShielding = true;  // Bottom-left: SHIELD (primary)
			}
			continue;
		}

		// Right shoulder buttons (x > ROAD_RIGHT)
		if (canvasX > ROAD_RIGHT) {
			const midY = CANVAS_H / 2;
			if (canvasY < midY) {
				input.isTouchEmp = true;       // Top-right: EMP (secondary)
			} else {
				input.isTouchForging = true;   // Bottom-right: FORGE
			}
			continue;
		}

		// On the road — steering
		input.touchStartX = x;
		input.touchCurrentX = x;
	}
}

export function handleTouchMove(input, e) {
	e.preventDefault();
	if (e.touches.length > 0) {
		// Use the first touch that's on the road for steering
		const rect = e.currentTarget.getBoundingClientRect();
		for (const touch of e.touches) {
			const x = touch.clientX - rect.left;
			const canvasX = x * (CANVAS_W / rect.width);
			if (canvasX >= ROAD_LEFT && canvasX <= ROAD_RIGHT) {
				input.touchCurrentX = x;
				break;
			}
		}
	}
}

export function handleTouchEnd(input, e) {
	e.preventDefault();
	// Only clear steering if no road touches remain
	let hasRoadTouch = false;
	const rect = e.currentTarget.getBoundingClientRect();
	for (const touch of e.touches) {
		const canvasX = (touch.clientX - rect.left) * (CANVAS_W / rect.width);
		if (canvasX >= ROAD_LEFT && canvasX <= ROAD_RIGHT) {
			hasRoadTouch = true;
			break;
		}
	}
	if (!hasRoadTouch) {
		input.touchStartX = null;
		input.touchCurrentX = null;
	}

	// Check if released touches were buttons
	const scaleX = CANVAS_W / rect.width;
	const scaleY = CANVAS_H / rect.height;
	for (const touch of e.changedTouches) {
		const canvasX = (touch.clientX - rect.left) * scaleX;
		const canvasY = (touch.clientY - rect.top) * scaleY;

		if (canvasX < ROAD_LEFT) {
			if (canvasY < CANVAS_H / 2) input.isTouchDumping = false;
			else input.isTouchShielding = false;
		} else if (canvasX > ROAD_RIGHT) {
			if (canvasY < CANVAS_H / 2) input.isTouchEmp = false;
			else input.isTouchForging = false;
		}
	}

	// Safety: if no touches left, clear everything
	if (e.touches.length === 0) {
		input.touchStartX = null;
		input.touchCurrentX = null;
		input.isTouchEmp = false;
		input.isTouchDumping = false;
		input.isTouchShielding = false;
		input.isTouchForging = false;
	}
}

export function getMoveDirection(input) {
	let moveX = 0;
	let moveY = 0;

	if (input.keys['ArrowLeft'] || input.keys['a'] || input.keys['A']) moveX = -1;
	if (input.keys['ArrowRight'] || input.keys['d'] || input.keys['D']) moveX = 1;
	if (input.keys['ArrowUp'] || input.keys['w'] || input.keys['W']) moveY = -1;
	if (input.keys['ArrowDown'] || input.keys['s'] || input.keys['S']) moveY = 1;

	// Touch steering
	if (input.touchCurrentX !== null && input.touchStartX !== null) {
		const dx = input.touchCurrentX - input.touchStartX;
		if (Math.abs(dx) > 10) moveX = dx > 0 ? 1 : -1;
	}

	return { moveX, moveY };
}

export function wantsShield(input) {
	// Space or Shift — primary weapon
	return input.keys[' '] || input.keys['Shift'] || input.isTouchShielding;
}

export function wantsEmp(input) {
	// E — secondary weapon
	return input.keys['e'] || input.keys['E'] || input.isTouchEmp;
}

export function wantsDump(input) {
	// Q on keyboard (easy reach from WASD)
	return input.keys['q'] || input.keys['Q'] || input.isTouchDumping;
}

export function wantsForge(input) {
	return input.keys['f'] || input.keys['F'] || input.isTouchForging;
}

export function wantsStart(input) {
	return input.keys[' '] || input.keys['Enter'];
}
