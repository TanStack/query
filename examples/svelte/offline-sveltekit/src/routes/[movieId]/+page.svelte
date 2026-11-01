<script lang="ts">
  import { resolve } from '$app/paths'
  import { queryClient } from '$lib/queryClient'
  import { moviesMutations, moviesQueries } from '$lib/services/movies/queries'
  import { createMutation, createQuery } from '@tanstack/svelte-query'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()

  const movieQuery = createQuery(() => moviesQueries.detail(data.movieId))

  let commentDraft = $state<string | undefined>()

  const updateMovie = createMutation(() => ({
    ...moviesMutations.update(),
    mutationKey: moviesQueries.detail(data.movieId).queryKey,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: moviesQueries.detail(data.movieId).queryKey,
      })
      const { queryKey } = moviesQueries.detail(data.movieId)
      const previousData = queryClient.getQueryData(queryKey)

      // remove local state so that server state is taken instead
      commentDraft = undefined

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
        moviesQueries.detail(data.movieId).queryKey,
        onMutateResult?.previousData,
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: moviesQueries.detail(data.movieId).queryKey,
      })
    },
  }))

  const comment = $derived(commentDraft ?? movieQuery.data?.movie.comment)

  const submitForm = (event: SubmitEvent) => {
    event.preventDefault()

    if (comment === undefined) {
      return
    }

    updateMovie.mutate({
      id: data.movieId,
      comment,
    })
  }
</script>

{#if movieQuery.isLoading}
  Loading...
{:else if movieQuery.data}
  <form onsubmit={submitForm}>
    <a href={resolve('/')}>Back</a>
    <h1>Movie: {movieQuery.data.movie.title}</h1>
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
          value={comment}
          oninput={(event) => {
            commentDraft = event.currentTarget.value
          }}></textarea>
      </label>
    </p>
    <button type="submit">Submit</button>
    <div>
      Updated at: {new Date(movieQuery.data.ts).toLocaleTimeString()}
    </div>
    <div>{movieQuery.isFetching ? 'fetching...' : ''}</div>
    <div>
      {updateMovie.isPaused
        ? 'mutation paused - offline'
        : updateMovie.isPending
          ? 'updating...'
          : ''}
    </div>
  </form>
{:else if movieQuery.isError}
  <div>
    <a href={resolve('/')}>Back</a>
    <h1>Couldn't load movie!</h1>
    <div>{movieQuery.error.message}</div>
  </div>
{:else if movieQuery.isPaused}
  We're offline and have no data to show :(
{/if}
