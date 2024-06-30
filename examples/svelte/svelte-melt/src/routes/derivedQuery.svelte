<script lang="ts">
  import { createQuery, useQueryClient } from '@tanstack/svelte-query-runes/dev'
  import { bookFilterStore } from './store.svelte'
  import { useQuery } from './external'
  import { useSvelteExtensionQuery } from './external.svelte'
  let a = { a: 1 }
  let b = ['hi', bookFilterStore]
  let p = $derived({ derived_state: bookFilterStore.paginate.page + 1 })
  function query(p) {
    const data = createQuery({
      queryKey: () => ['paginate', p()],
      queryFn: async () => {
        const s = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'].map((v) => {
          return { title: v }
        })
        if (Math.abs(bookFilterStore.paginate.page % 2) == 1) {
          return s.slice(0, 5)
        }
        return s.slice(5, 6)
      },
      staleTime: 5000,
    })
    return data
  }
  let data = query(() => p)
</script>

<h2>testing derived query with list</h2>
{data.fetchStatus}
{data.isLoading}
{data.isFetching}
{data.isRefetching}
<button
  onclick={() => {
    console.log('click +1')
    bookFilterStore.paginate.page += 1
    //	p += 1;
  }}>next</button
>
<button
  onclick={() => {
    console.log('click -1')
    bookFilterStore.paginate.page -= 1
    //	p += 1;
  }}>prev</button
>
{bookFilterStore.paginate.page}
{p.derived_state}
{#each data?.data ?? [] as item}
  <div>{item.title}</div>
{/each}
