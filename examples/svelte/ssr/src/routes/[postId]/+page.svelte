<script lang="ts">
  import Post from '$lib/Post.svelte'

  const { data } = $props()
</script>

<Post postId={data.postId} />
