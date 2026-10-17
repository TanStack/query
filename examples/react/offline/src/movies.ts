import * as React from 'react'
import {
  mutationOptions,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import * as api from './api'

export const movieKeys = {
  all: () => ['movies'],
  list: () => [...movieKeys.all(), 'list'],
  details: () => [...movieKeys.all(), 'detail'],
  detail: (id: string) => [...movieKeys.details(), id],
}

export const movieQueryOptions = (movieId: string) =>
  queryOptions({
    queryKey: movieKeys.detail(movieId),
    queryFn: () => api.fetchMovie(movieId),
  })

export const updateMovieMutationOptions = () =>
  mutationOptions({
    mutationFn: async (
      { id, comment }: { id: string; comment: string },
      context,
    ) => {
      // to avoid clashes with our optimistic update when an offline mutation continues
      await context.client.cancelQueries({ queryKey: movieKeys.detail(id) })
      return api.updateMovie(id, comment)
    },
  })

export const useMovie = (movieId: string) => {
  const queryClient = useQueryClient()

  const movieQuery = useQuery(movieQueryOptions(movieId))

  const [comment, setComment] = React.useState<string | undefined>()

  const updateMovie = useMutation({
    ...updateMovieMutationOptions(),
    mutationKey: movieKeys.detail(movieId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: movieKeys.detail(movieId) })
      const { queryKey } = movieQueryOptions(movieId)
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
        movieQueryOptions(movieId).queryKey,
        onMutateResult?.previousData,
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: movieKeys.detail(movieId) })
    },
  })

  return {
    comment: comment ?? movieQuery.data?.movie.comment,
    setComment,
    updateMovie,
    movieQuery,
  }
}
