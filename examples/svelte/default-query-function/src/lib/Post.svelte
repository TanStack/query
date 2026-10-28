<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import type { Post } from './types'

  let {
    postId,
    setPostId,
  }: { postId: number; setPostId: (postId: number) => void } = $props()

  // You can even leave out the queryFn and just go straight into options
  const query = createQuery<Post>(() => ({
    queryKey: [`/posts/${postId}`],
    enabled: !!postId,
  }))
</script>

<div>
  <div>
    <a
      href="#posts"
      onclick={(e) => {
        e.preventDefault()
        setPostId(-1)
      }}
    >
      Back
    </a>
  </div>
  {#if !postId || query.status === 'pending'}
    Loading...
  {:else if query.status === 'error'}
    <span>Error: {query.error.message}</span>
  {:else}
    <h1>{query.data.title}</h1>
    <div>
      <p>{query.data.body}</p>
    </div>
    <div>{query.isFetching ? 'Background Updating...' : ' '}</div>
  {/if}
</div>
