<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
  import Post from './lib/Post.svelte'
  import Posts from './lib/Posts.svelte'

  const queryClient = new QueryClient()

  let postId = $state<string | null>(null)

  const setPostId = (id: string | null) => {
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
  {#if postId !== null}
    <Post {postId} {setPostId} />
  {:else}
    <Posts {setPostId} />
  {/if}
  <SvelteQueryDevtools initialIsOpen />
</QueryClientProvider>
