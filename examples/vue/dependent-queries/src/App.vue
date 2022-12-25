<script lang="ts">
import { defineComponent, ref } from 'vue'

import Posts from './Posts.vue'
import Post from './Post.vue'

export default defineComponent({
  name: 'App',
  components: { Posts, Post },
  setup() {
    const visitedPosts = ref(new Set())
    const isVisited = (id: number) => visitedPosts.value.has(id)

    const postId = ref(-1)
    const setPostId = (id: number) => {
      visitedPosts.value.add(id)
      postId.value = id
    }

    return {
      isVisited,
      postId,
      setPostId,
    }
  },
})
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
    loaded. This Data is not directly included in the
    <code>/post/id</code> response but gets fetched when the post gets loaded
    from its <code>userId</code>.
    <strong>
      (You may need to throttle your network speed to simulate longer loading
      sequences)
    </strong>
  </p>
  <Post v-if="postId > -1" :postId="postId" @setPostId="setPostId" />
  <Posts v-else :isVisited="isVisited" @setPostId="setPostId" />
</template>
