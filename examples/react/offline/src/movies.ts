import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { moviesMutations, moviesQueries } from './services/movies/queries'

export const useMovie = (movieId: string) => {
  const queryClient = useQueryClient()

  const movieQuery = useQuery(moviesQueries.detail(movieId))

  const [comment, setComment] = React.useState<string | undefined>()

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

  return {
    comment: comment ?? movieQuery.data?.movie.comment,
    setComment,
    updateMovie,
    movieQuery,
  }
}
