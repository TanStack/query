<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { getPostById } from './data'

  export let postId: number
  export let setPostId: (id: number) => void

  const post = createQuery<{ title: string; body: string }, Error>({
    queryKey: ['post', postId],
    queryFn: () => getPostById(postId),
    enabled: !!postId,
  })
</script>

<div>
  <div>
    <button class="btn btn-primary" on:click={() => setPostId(-1)}>
      Back
    </button>
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
