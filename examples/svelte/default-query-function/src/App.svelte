<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
  import Post from './lib/Post.svelte'
  import Posts from './lib/Posts.svelte'
  import type { QueryKey } from '@tanstack/svelte-query'

  // Define a default query function that will receive the query key
  const defaultQueryFn = async ({ queryKey }: { queryKey: QueryKey }) => {
    const response = await fetch(
      `https://jsonplaceholder.typicode.com${queryKey[0]}`,
    )
    if (!response.ok) throw new Error('Failed to fetch data')
    return await response.json()
  }

  // provide the default query function to your app via the query client
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: defaultQueryFn,
      },
    },
  })

  let postId = $state(-1)

  const setPostId = (id: number) => {
    postId = id
  }
</script>

<QueryClientProvider client={queryClient}>
  <p>
    As you visit the posts below, you will notice them in a loading state the
    first time you load them. However, after you return to this list and click
    on any posts you have already visited again, you will see them load
    instantly and background refresh right before your eyes!
    <strong>
      (You may need to throttle your network speed to simulate longer loading
      sequences)
    </strong>
  </p>
  {#if postId > -1}
    <Post {postId} {setPostId} />
  {:else}
    <Posts {setPostId} />
  {/if}
  <SvelteQueryDevtools initialIsOpen />
</QueryClientProvider>
