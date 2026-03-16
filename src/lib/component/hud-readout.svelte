<script>
	let { label, value, unit = '', status = 'normal' } = $props();

	const statusColor = {
		normal: 'text-cyan-500',
		warn: 'text-amber-500',
		error: 'text-red-500'
	};
</script>

<div class="border-l-2 border-green-500/40 pl-3 bg-green-500/5 py-2 px-3">
	<dt class="text-xs font-mono uppercase tracking-wider text-amber-500/80">{label}</dt>
	<dd class="mt-0.5 text-2xl font-semibold font-mono {statusColor[status] || statusColor.normal}">
		{value}{#if unit}<span class="text-sm ml-1 opacity-60">{unit}</span>{/if}
	</dd>
</div>
