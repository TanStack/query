<script lang="ts">
	import { createMutation, createQuery, hashKey, useQueryClient } from '@tanstack/svelte-query/dev';
	import { bookFilterStore } from './store.svelte';
	let a = { a: 1 };
	let b = ['cache update tester', bookFilterStore];

	const data = createQuery(() => {
		return {
			queryKey: b,
			queryFn: async () => {
				const s = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'].map((v) => {
					return { title: v };
				});
				if (Math.abs(bookFilterStore.paginate.page % 2) == 1) {
					return s.slice(0, 5);
				}
				return s.slice(5, 6);
			},
			staleTime: 5000000
		};
	});
	const client = useQueryClient();
	const update = createMutation({
		mutationFn: () => {
			return ['a new list of items', 'a'];
		},
		onSuccess: (v) => {
			const k = b.map((v) => $state.snapshot(v));
			client.setQueryData(k, (v) => {
				debugger;
				v[0].title = 'faker';
				return v;
			});
		}
	});
	/* 	const querycache = useQueryClient().getQueryCache();
	$effect(() => {
		if (data.fetchStatus) {
			console.log(data.fetchStatus);
		}
		const ret = querycache.find({ queryKey: b, exact: false });
		//console.log('find  in query cache', ret);
	}); */
</script>

<button
	onclick={() => {
		update.mutate();
	}}>update cache</button
>

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
<pre>{JSON.stringify(data.data, null, 1)}</pre>
{#each data?.data ?? [] as item}
	<div>{item.title}</div>
{/each}
