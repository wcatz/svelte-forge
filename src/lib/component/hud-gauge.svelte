<script>
	let { value = 0, max = 100, label = '', unit = '%', thresholds = { warn: 70, crit: 90 } } = $props();

	const pct = Math.min(Math.max(value / max, 0), 1);
	const angle = pct * 270;

	// Arc parameters (270-degree sweep)
	const cx = 50;
	const cy = 50;
	const r = 38;
	const startAngle = 135; // degrees
	const endAngle = startAngle + 270;

	function polarToCartesian(cx, cy, r, angleDeg) {
		const rad = ((angleDeg - 90) * Math.PI) / 180;
		return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
	}

	function describeArc(cx, cy, r, startAngle, endAngle) {
		const start = polarToCartesian(cx, cy, r, endAngle);
		const end = polarToCartesian(cx, cy, r, startAngle);
		const largeArc = endAngle - startAngle > 180 ? 1 : 0;
		return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
	}

	const bgPath = describeArc(cx, cy, r, startAngle, endAngle);
	const valuePath = angle > 0 ? describeArc(cx, cy, r, startAngle, startAngle + angle) : '';

	const color =
		value >= thresholds.crit ? '#ef4444' : value >= thresholds.warn ? '#f59e0b' : '#22c55e';
</script>

<div class="flex flex-col items-center">
	<svg viewBox="0 0 100 100" class="w-24 h-24">
		<!-- Background arc -->
		<path d={bgPath} fill="none" stroke="currentColor" stroke-width="6" class="text-gray-800" />
		<!-- Value arc -->
		{#if valuePath}
			<path
				d={valuePath}
				fill="none"
				stroke={color}
				stroke-width="6"
				stroke-linecap="round"
				style="filter: drop-shadow(0 0 4px {color}40);"
			/>
		{/if}
		<!-- Value text -->
		<text
			x={cx}
			y={cy - 2}
			text-anchor="middle"
			dominant-baseline="middle"
			fill={color}
			class="text-lg font-mono font-bold"
			style="font-size: 16px;"
		>
			{typeof value === 'number' ? value.toFixed(0) : value}
		</text>
		<text
			x={cx}
			y={cy + 12}
			text-anchor="middle"
			dominant-baseline="middle"
			fill="currentColor"
			class="text-gray-500"
			style="font-size: 8px;"
		>
			{unit}
		</text>
	</svg>
	{#if label}
		<span class="text-xs font-mono uppercase tracking-wider text-amber-500/80 mt-1">{label}</span>
	{/if}
</div>
