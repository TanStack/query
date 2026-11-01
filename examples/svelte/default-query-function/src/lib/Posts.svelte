<script lang="ts">
  import { createQuery, useQueryClient } from '@tanstack/svelte-query'
  import type { Post } from './types'

  type Props = {
    setPostId: (postId: number) => void
  }

  let { setPostId }: Props = $props()

  const queryClient = useQueryClient()

  // All you have to do now is pass a key!
  const query = createQuery<Array<Post>>(() => ({
    queryKey: ['/posts'],
  }))
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
              style={// We can use the queryCache here to show bold links for
              // ones that are cached
              queryClient.getQueryData([`/posts/${post.id}`])
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
