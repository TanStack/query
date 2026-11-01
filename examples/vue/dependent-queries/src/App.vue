<script setup lang="ts">
import { ref } from 'vue'

import PostList from './PostList.vue'
import PostDetail from './PostDetail.vue'

const postId = ref(-1)
const setPostId = (id: number) => {
  postId.value = id
}
</script>

<template>
  <h1>Vue Query - Dependent Queries</h1>
  <p>
    As you visit the posts below, you will notice them in a loading state the
    first time you load them. However, after you return to this list and click
    on any posts you have already visited again, you will see them load
    instantly and background refresh right before your eyes!
    <br />
    You will also notice, that after some time the name of the author gets
    loaded. This data is not directly included in the
    <code>/posts/id</code> response but gets fetched when the post gets loaded
    from its <code>userId</code>.
    <strong>
      (You may need to throttle your network speed to simulate longer loading
      sequences)
    </strong>
  </p>
  <PostDetail v-if="postId > -1" :post-id="postId" @set-post-id="setPostId" />
  <PostList v-else @set-post-id="setPostId" />
</template>
