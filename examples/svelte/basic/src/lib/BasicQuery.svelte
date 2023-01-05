<script lang="ts">
  import Post from './Post.svelte'
  import Posts from './Posts.svelte'

  let postId = -1
  const setPostId = (id: number) => {
    postId = id
  }
</script>

{#if postId > -1}
  <Post {postId} {setPostId} />
{:else}
  <Posts {setPostId} />
{/if}
