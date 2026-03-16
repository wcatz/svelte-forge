<script>
	let { opacity = 0.03 } = $props();
</script>

<div
	class="absolute inset-0 pointer-events-none z-10"
	style="background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,{opacity}) 2px, rgba(0,255,0,{opacity}) 4px);"
/>
