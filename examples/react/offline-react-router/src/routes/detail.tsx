import {
  cancelQueries,
  getQueryData,
  invalidateQueries,
  isError,
  isFetching,
  isLoading,
  isPaused,
  noop,
  onlineManager,
  query,
  setQueryData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import * as React from 'react'
import { Link, useLoaderData } from 'react-router'
import { moviesMutations, moviesQueries } from '../services/movies/queries'
import type { QueryClient } from '@tanstack/react-query'
import type { LoaderFunctionArgs } from 'react-router'

export const loader =
  (queryClient: QueryClient, isRestoring: () => boolean) =>
  async ({ params }: LoaderFunctionArgs) => {
    if (!params.movieId) {
      throw new Error('No movie ID provided')
    }
    const { queryKey } = moviesQueries.detail(params.movieId)
    if (
      !getQueryData(queryClient, queryKey) &&
      // do not load if we are offline or hydrating because it returns a promise that is pending until we go online again
      // we just let the Detail component handle it
      onlineManager.isOnline() &&
      !isRestoring()
    ) {
      await query(queryClient, moviesQueries.detail(params.movieId)).catch(noop)
    }
    return { movieId: params.movieId }
  }

export default function Detail() {
  const { movieId } = useLoaderData<ReturnType<typeof loader>>()
  const queryClient = useQueryClient()
  const movieQuery = useQuery(moviesQueries.detail(movieId))

  const [commentDraft, setCommentDraft] = React.useState<string | undefined>()

  const updateMovie = useMutation({
    ...moviesMutations.update(),
    mutationKey: moviesQueries.detail(movieId).queryKey,
    onMutate: async (variables) => {
      await cancelQueries(queryClient, {
        queryKey: moviesQueries.detail(movieId).queryKey,
      })
      const { queryKey } = moviesQueries.detail(movieId)
      const previousData = getQueryData(queryClient, queryKey)

      // remove local state so that server state is taken instead
      setCommentDraft(undefined)

      setQueryData(
        queryClient,
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
      setQueryData(
        queryClient,
        moviesQueries.detail(movieId).queryKey,
        onMutateResult?.previousData,
      )
    },
    onSettled: () => {
      invalidateQueries(queryClient, {
        queryKey: moviesQueries.detail(movieId).queryKey,
      })
    },
  })

  const comment = commentDraft ?? movieQuery.data?.movie.comment

  if (isLoading(movieQuery)) {
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
        <div>{isFetching(movieQuery) && 'fetching...'}</div>
        <div>
          {updateMovie.isPaused
            ? 'mutation paused - offline'
            : updateMovie.isPending && 'updating...'}
        </div>
      </form>
    )
  }

  if (isError(movieQuery)) {
    return (
      <div>
        <Link to="/">Back</Link>
        <h1>Couldn't load movie!</h1>
        <div>{movieQuery.error.message}</div>
      </div>
    )
  }

  if (isPaused(movieQuery)) {
    return "We're offline and have no data to show :("
  }

  return null
}
