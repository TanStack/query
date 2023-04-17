<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { getPostById } from './data'
  import type { Post } from './types'

  export let postId: number

  const post = createQuery<Post, Error>({
    queryKey: ['post', postId],
    queryFn: () => getPostById(postId),
  })
</script>

<div>
  <div>
    <a class="button" href="/"> Back </a>
  </div>
  {#if !postId || $post.isLoading}
    <span>Loading...</span>
  {/if}
  {#if $post.error}
    <span>Error: {$post.error.message}</span>
  {/if}
  {#if $post.isSuccess}
    <h1>{$post.data.title}</h1>
    <div>
      <p>{$post.data.body}</p>
    </div>
    <div>{$post.isFetching ? 'Background Updating...' : ' '}</div>
  {/if}
</div>
