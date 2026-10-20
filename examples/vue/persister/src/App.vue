<script setup lang="ts">
import { ref } from 'vue'

import Posts from './Posts.vue'
import Post from './Post.vue'

const postId = ref(-1)
const setPostId = (id: number) => {
  postId.value = id
}
</script>

<template>
  <h1>Vue Query - Persister</h1>
  <p>
    As you visit the posts below, you will notice them in a loading state the
    first time you load them. However, after you return to this list and click
    on any posts you have already visited again, you will see them load
    instantly and background refresh right before your eyes!
    <strong>
      (You may need to throttle your network speed to simulate longer loading
      sequences)
    </strong>
  </p>
  <Post v-if="postId > -1" :postId="postId" @setPostId="setPostId" />
  <Posts v-else @setPostId="setPostId" />
</template>
