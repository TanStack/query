<script lang="ts">
  import type { DehydratedState } from '@tanstack/svelte-query'
  import Post from '$lib/Post.svelte'
  import Posts from '$lib/Posts.svelte'
  import { dehydratedState } from '$lib/store'

  type Data = {
    dehydratedState: DehydratedState
  }

  export let data: Data

  dehydratedState.set(data.dehydratedState)

  $: console.log($dehydratedState)

  let postId = -1
  const setPostId = (id: number) => {
    postId = id
  }
</script>

<h1>Basic Query with Hydration</h1>
{#if postId > -1}
  <Post {postId} {setPostId} />
{:else}
  <Posts {setPostId} />
{/if}

<style>
</style>
