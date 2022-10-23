<script lang="ts">
  import Post from './lib/Post.svelte'
  import Posts from './lib/Posts.svelte'

  let postId = -1
  const setPostId = (id: number) => {
    postId = id
  }
</script>

<main>
  <h1>Basic Query</h1>
  {#if postId > -1}
    <Post {postId} {setPostId} />
  {:else}
    <Posts {setPostId} />
  {/if}
</main>

<style>
</style>
