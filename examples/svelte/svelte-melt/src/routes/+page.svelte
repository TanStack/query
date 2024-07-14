<script lang="ts">
	import { createQuery, QueryClient } from '@tanstack/svelte-query';

	let count = $state(-1);

	const options = $derived({
		queryKey: () => [count, 'count'],
		queryFn: async () => {
			return count;
		},
		enabled: () => count === 0
	});

	const query = createQuery(options);
</script>

<button onclick={() => (count += 1)}>Increment</button>
<div>Data: {query.data ?? 'undefined'}</div>
<div>Count: {count}</div>
