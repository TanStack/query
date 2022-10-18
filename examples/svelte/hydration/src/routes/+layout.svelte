<script lang="ts">
	import '../app.css';
	import { useHydrate } from '@tanstack/svelte-query';
	import { dehydratedState } from '$lib/store';

	useHydrate($dehydratedState);
</script>

<main>
	<slot />
</main>
