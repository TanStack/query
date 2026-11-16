<script setup lang="ts">
import { computed, ref } from 'vue'
import { Link, useParams } from '@tanstack/vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { moviesMutations, moviesQueries } from '../services/movies/queries'

const movieId = useParams({
  from: '/$movieId',
  select: (params) => params.movieId,
})

const queryClient = useQueryClient()
const { data, error, isError, isFetching, isLoading, isPaused } = useQuery(() =>
  moviesQueries.detail(movieId.value),
)

const commentDraft = ref<string | undefined>()

const {
  mutate,
  isPaused: isMutationPaused,
  isPending: isMutationPending,
} = useMutation(() => ({
  ...moviesMutations.update(),
  mutationKey: moviesQueries.detail(movieId.value).queryKey,
  onMutate: async (variables) => {
    await queryClient.cancelQueries({
      queryKey: moviesQueries.detail(movieId.value).queryKey,
    })
    const { queryKey } = moviesQueries.detail(movieId.value)
    const previousData = queryClient.getQueryData(queryKey)

    // remove local state so that server state is taken instead
    commentDraft.value = undefined

    queryClient.setQueryData(
      queryKey,
      (old) =>
        old && {
          ...old,
          movie: {
            ...old.movie,
            comment: variables.comment,
          },
        },
    )

    return { previousData }
  },
  onError: (_, __, onMutateResult) => {
    queryClient.setQueryData(
      moviesQueries.detail(movieId.value).queryKey,
      onMutateResult?.previousData,
    )
  },
  onSettled: () => {
    queryClient.invalidateQueries({
      queryKey: moviesQueries.detail(movieId.value).queryKey,
    })
  },
}))

const comment = computed(() => commentDraft.value ?? data.value?.movie.comment)

const submitForm = () => {
  if (comment.value === undefined) {
    return
  }

  mutate({
    id: movieId.value,
    comment: comment.value,
  })
}
</script>

<template>
  <template v-if="isLoading">Loading...</template>
  <form v-else-if="data" @submit.prevent="submitForm">
    <Link to="/">Back</Link>
    <h1>Movie: {{ data.movie.title }}</h1>
    <p>
      Try to mock offline behavior with the button in the devtools, then update
      the comment. The optimistic update will succeed, but the actual mutation
      will be paused and resumed once you go online again.
    </p>
    <p>
      You can also reload the page, which will make the persisted mutation
      resume, as you will be online again when you "come back".
    </p>
    <p>
      <label>
        Comment: <br />
        <textarea
          name="comment"
          :value="comment"
          @input="commentDraft = ($event.target as HTMLTextAreaElement).value"
        />
      </label>
    </p>
    <button type="submit">Submit</button>
    <div>Updated at: {{ new Date(data.ts).toLocaleTimeString() }}</div>
    <div>{{ isFetching ? 'fetching...' : '' }}</div>
    <div>
      {{
        isMutationPaused
          ? 'mutation paused - offline'
          : isMutationPending
            ? 'updating...'
            : ''
      }}
    </div>
  </form>
  <div v-else-if="isError">
    <Link to="/">Back</Link>
    <h1>Couldn't load movie!</h1>
    <div>{{ error?.message }}</div>
  </div>
  <template v-else-if="isPaused">
    We're offline and have no data to show :(
  </template>
</template>
