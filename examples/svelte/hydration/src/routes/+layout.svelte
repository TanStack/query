<script lang="ts">
	import '../app.css';
	import { setQueryClient, useHydrate } from '@tanstack/svelte-query';
	import { dehydratedState } from '$lib/store';

	setQueryClient();

	useHydrate($dehydratedState);
</script>

<main>
	<slot />
</main>
