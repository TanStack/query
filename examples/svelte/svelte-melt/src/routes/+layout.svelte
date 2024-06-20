<script lang="ts">
	import { QueryClientProvider, QueryClient } from '@tanstack/svelte-query-runes/dev';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';

	const queryClient = new QueryClient();
</script>

<QueryClientProvider client={queryClient}>
	<SvelteQueryDevtools />
	<main>
		<slot />
	</main>
</QueryClientProvider>
