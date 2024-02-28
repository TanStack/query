<script lang="ts">
	import { createQuery, useQueryClient } from 'svelte-query/dev';
	import { bookFilterStore } from './store.svelte';
	import { unstate } from 'svelte';
	import { useQuery } from './external';
	import { useSvelteExtensionQuery } from './external.svelte';
	let a = { a: 1 };
	let b = ['hi', bookFilterStore];
	const data = createQuery(() => {
		return {
			queryKey: ['paginate', bookFilterStore],
			queryFn: async () => {
				const s = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'].map((v) => {
					return { title: v };
				});
				if (Math.abs(bookFilterStore.paginate.page % 2) == 1) {
					return s.slice(0, 5);
				}
				return s.slice(5, 6);
			},
			staleTime: 5000,
			enabled: bookFilterStore.paginate.page % 2 == 1
		};
	});
	const external = useQuery(bookFilterStore);
	const externalsv = useSvelteExtensionQuery(bookFilterStore);
	/* 	const querycache = useQueryClient().getQueryCache();
	$effect(() => {
		if (data.fetchStatus) {
			console.log(data.fetchStatus);
		}
		const ret = querycache.find({ queryKey: b, exact: false });
		//console.log('find  in query cache', ret);
	}); */
</script>

<h2>testing create query with list</h2>

{data.fetchStatus}
{data.isLoading}
{data.isFetching}
{data.isRefetching}
<button
	onclick={() => {
		console.log('click +1');
		bookFilterStore.paginate.page += 1;
	}}>next</button
>
<button
	onclick={() => {
		console.log('click -1');
		bookFilterStore.paginate.page -= 1;
	}}>prev</button
>
{bookFilterStore.paginate.page}
{#each data?.data ?? [] as item}
	<div>{item.title}</div>
{/each}

-------------
{external.data}
-------------
{externalsv.data}
