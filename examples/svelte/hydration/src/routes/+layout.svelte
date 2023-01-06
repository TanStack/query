<script lang="ts">
	import '../app.css';
	import { QueryClient, QueryClientProvider, useHydrate } from '@tanstack/svelte-query';
	import { dehydratedState } from '$lib/store';

	const queryClient = new QueryClient()

	useHydrate($dehydratedState);
</script>

<QueryClientProvider client={queryClient}>
	<main>
		<slot />
	</main>
</QueryClientProvider>
