<script lang="ts">
  import { useQueryClient, createQuery } from '@tanstack/svelte-query'
  import { api } from './api'

  const client = useQueryClient()

  const limit = 10

  const posts = createQuery<
    { id: number; title: string; body: string }[],
    Error
  >(() => ({
    queryKey: ['posts', limit],
    queryFn: () => api().getPosts(limit),
  }))
</script>

<div>
  <div>
    {#if posts.status === 'pending'}
      <span>Loading...</span>
    {:else if posts.status === 'error'}
      <span>Error: {posts.error.message}</span>
    {:else}
      <ul>
        {#each posts.data as post}
          <article>
            <a
              href={`/${post.id}`}
              style={// We can use the queryCache here to show bold links for
              // ones that are cached
              client.getQueryData(['post', post.id])
                ? 'font-weight: bold; color: indianred'
                : 'cursor: pointer'}
            >
              {post.title}
            </a>
          </article>
        {/each}
      </ul>
      {#if posts.isFetching}
        <div style="color:darkgreen; font-weight:700">
          Background Updating...
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  article {
    text-align: left;
  }
  a {
    display: block;
    color: white;
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
</style>
