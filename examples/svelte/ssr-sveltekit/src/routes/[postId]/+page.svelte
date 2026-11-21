<script lang="ts">
  import Post from '$lib/Post.svelte'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()
</script>

<Post postId={data.postId} />
