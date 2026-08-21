<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useQuery } from '@tanstack/vue-query'

import { Author, Post } from './types'

const fetchPost = async (id: number): Promise<Post> =>
  await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`).then(
    (response) => response.json(),
  )

const fetchAuthor = async (id: number): Promise<Author> =>
  await fetch(`https://jsonplaceholder.typicode.com/users/${id}`).then(
    (response) => response.json(),
  )

export default defineComponent({
  name: 'PostDetails',
  props: {
    postId: {
      type: Number,
      required: true,
    },
  },
  emits: ['setPostId'],
  setup(props) {
    const {
      isPending,
      isError,
      isFetching,
      data: post,
      error,
    } = useQuery({
      queryKey: ['post', () => props.postId],
      queryFn: () => fetchPost(props.postId),
    })

    const authorId = computed(() => post.value?.userId)

    const { data: author } = useQuery({
      queryKey: ['author', authorId],
      queryFn: ({ queryKey: [, id] }) => fetchAuthor(id),
      enabled: computed(() => !!authorId.value),
    })

    return { isPending, isError, isFetching, post, error, author }
  },
})
</script>

<template>
  <h1>Post {{ postId }}</h1>
  <a @click="$emit('setPostId', -1)" href="#"> Back </a>
  <div v-if="isPending" class="update">Loading...</div>
  <div v-else-if="isError">An error has occurred: {{ error }}</div>
  <div v-else-if="post">
    <h1>
      {{ post.title }} <span v-if="author">by {{ author.name }}</span>
    </h1>
    <div>
      <p>{{ post.body }}</p>
    </div>
    <div v-if="isFetching" class="update">Background Updating...</div>
  </div>
</template>

<style scoped>
.update {
  font-weight: bold;
  color: green;
}
</style>
