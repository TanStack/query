<script lang="ts">
  import { createQuery, useQueryClient } from '@tanstack/svelte-query'
  import { postsQueries } from './services/posts/queries'

  type Props = {
    setPostId: (postId: string | null) => void
  }

  let { setPostId }: Props = $props()

  const queryClient = useQueryClient()
  const query = createQuery(() => postsQueries.list())
</script>

<div>
  <h1>Posts</h1>
  <div>
    {#if query.status === 'pending'}
      Loading...
    {:else if query.status === 'error'}
      <span>Error: {query.error.message}</span>
    {:else}
      <div>
        {#each query.data as post (post.id)}
          <p>
            <a
              onclick={(e) => {
                e.preventDefault()
                setPostId(post.id)
              }}
              href="#{post.id}"
              style={// We can find the existing query data here to show bold links for
              // ones that are cached
              queryClient.getQueryData(postsQueries.detail(post.id).queryKey)
                ? 'font-weight: bold; color: green'
                : ''}
            >
              {post.title}
            </a>
          </p>
        {/each}
      </div>
      <div>{query.isFetching ? 'Background Updating...' : ' '}</div>
    {/if}
  </div>
</div>
