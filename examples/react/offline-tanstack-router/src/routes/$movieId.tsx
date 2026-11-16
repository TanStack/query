import {
  onlineManager,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { moviesMutations, moviesQueries } from '../services/movies/queries'

export const Route = createFileRoute('/$movieId')({
  loader: ({ context: { queryClient, isRestoring }, params: { movieId } }) =>
    queryClient.getQueryData(moviesQueries.detail(movieId).queryKey) ??
    // do not load if we are offline or hydrating because it returns a promise that is pending until we go online again
    // we just let the Detail component handle it
    (onlineManager.isOnline() && !isRestoring
      ? queryClient.query(moviesQueries.detail(movieId))
      : undefined),
  component: Detail,
})

function Detail() {
  const { movieId } = Route.useParams()
  const queryClient = useQueryClient()
  const movieQuery = useQuery(moviesQueries.detail(movieId))

  const [commentDraft, setCommentDraft] = React.useState<string | undefined>()

  const updateMovie = useMutation({
    ...moviesMutations.update(),
    mutationKey: moviesQueries.detail(movieId).queryKey,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: moviesQueries.detail(movieId).queryKey,
      })
      const { queryKey } = moviesQueries.detail(movieId)
      const previousData = queryClient.getQueryData(queryKey)

      // remove local state so that server state is taken instead
      setCommentDraft(undefined)

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
        moviesQueries.detail(movieId).queryKey,
        onMutateResult?.previousData,
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: moviesQueries.detail(movieId).queryKey,
      })
    },
  })

  const comment = commentDraft ?? movieQuery.data?.movie.comment

  if (movieQuery.isLoading) {
    return 'Loading...'
  }

  function submitForm(event: any) {
    event.preventDefault()

    if (comment === undefined) {
      return
    }

    updateMovie.mutate({
      id: movieId,
      comment,
    })
  }

  if (movieQuery.data) {
    return (
      <form onSubmit={submitForm}>
        <Link to="/">Back</Link>
        <h1>Movie: {movieQuery.data.movie.title}</h1>
        <p>
          Try to mock offline behavior with the button in the devtools, then
          update the comment. The optimistic update will succeed, but the actual
          mutation will be paused and resumed once you go online again.
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
              onChange={(event) => setCommentDraft(event.target.value)}
            />
          </label>
        </p>
        <button type="submit">Submit</button>
        <div>
          Updated at: {new Date(movieQuery.data.ts).toLocaleTimeString()}
        </div>
        <div>{movieQuery.isFetching && 'fetching...'}</div>
        <div>
          {updateMovie.isPaused
            ? 'mutation paused - offline'
            : updateMovie.isPending && 'updating...'}
        </div>
      </form>
    )
  }

  if (movieQuery.isError) {
    return (
      <div>
        <Link to="/">Back</Link>
        <h1>Couldn't load movie!</h1>
        <div>{movieQuery.error.message}</div>
      </div>
    )
  }

  if (movieQuery.isPaused) {
    return "We're offline and have no data to show :("
  }

  return null
}
