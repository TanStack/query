import { createSignal } from 'solid-js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import { moviesMutations, moviesQueries } from './services/movies/queries'
import type { Accessor } from 'solid-js'

export const useMovie = (movieId: Accessor<string>) => {
  const queryClient = useQueryClient()

  const movieQuery = useQuery(() => moviesQueries.detail(movieId()))

  const [comment, setComment] = createSignal<string | undefined>()

  const updateMovie = useMutation(() => ({
    ...moviesMutations.update(),
    mutationKey: moviesQueries.detail(movieId()).queryKey,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: moviesQueries.detail(movieId()).queryKey,
      })
      const { queryKey } = moviesQueries.detail(movieId())
      const previousData = queryClient.getQueryData(queryKey)

      // remove local state so that server state is taken instead
      setComment(undefined)

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
        moviesQueries.detail(movieId()).queryKey,
        onMutateResult?.previousData,
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: moviesQueries.detail(movieId()).queryKey,
      })
    },
  }))

  return {
    comment: () => comment() ?? movieQuery.data?.movie.comment,
    setComment,
    updateMovie,
    movieQuery,
  }
}
