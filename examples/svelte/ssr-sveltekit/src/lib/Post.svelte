<script lang="ts">
  import { resolve } from '$app/paths'
  import { createQuery } from '@tanstack/svelte-query'
  import { postsQueries } from './services/posts/queries'

  type Props = {
    postId: number
  }

  let { postId }: Props = $props()

  const post = createQuery(() => postsQueries.detail(postId))
</script>

<div>
  <div>
    <a class="button" href={resolve('/')}> Back </a>
  </div>
  {#if post.isPending}
    <span>Loading...</span>
  {/if}
  {#if post.error}
    <span>Error: {post.error.message}</span>
  {/if}
  {#if post.isSuccess}
    <h1>{post.data.title}</h1>
    <div>
      <p>{post.data.body}</p>
    </div>
    <div>{post.isFetching ? 'Background Updating...' : ' '}</div>
  {/if}
</div>
