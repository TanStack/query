<script lang="ts">
	import { createQueries } from '@tanstack/svelte-query/dev';
	function sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
	async function fetchPost(id) {
		await sleep(id * 100);
		return [id, Date.now(), Date.now()] as number[];
	}
	const ids = [1, 2, 3];
	const combinedQueries = createQueries({
		queries: ids.map((id) => ({
			queryKey: ['post', id],
			queryFn: () => fetchPost(id)
		})),
		combine: (results) => {
			return {
				data: results.map((result) => result.data),
				pending: results.some((result) => result.isPending)
			};
		}
	});
</script>

{JSON.stringify(combinedQueries)}
