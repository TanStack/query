<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { postsQueries } from './services/posts/queries'

  let {
    postId,
    setPostId,
  }: { postId: string; setPostId: (postId: string | null) => void } = $props()

  const query = createQuery(() => postsQueries.detail(postId))
</script>

<div>
  <div>
    <a
      href="#posts"
      onclick={(e) => {
        e.preventDefault()
        setPostId(null)
      }}
    >
      Back
    </a>
  </div>
  {#if query.status === 'pending'}
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
