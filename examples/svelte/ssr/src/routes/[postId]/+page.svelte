<script lang="ts">
import Post from '$lib/Post.svelte'
import type { PageData } from './$types'

export let data: PageData
</script>

<Post postId={data.postId} />
