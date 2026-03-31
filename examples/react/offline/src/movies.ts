import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'

export const movieKeys = {
  all: () => ['movies'],
  list: () => [...movieKeys.all(), 'list'],
  details: () => [...movieKeys.all(), 'detail'],
  detail: (id: string) => [...movieKeys.details(), id],
}

export const useMovie = (movieId: string) => {
  const queryClient = useQueryClient()

  const movieQuery = useQuery({
    queryKey: movieKeys.detail(movieId),
    queryFn: () => api.fetchMovie(movieId),
  })

  const [comment, setComment] = React.useState<string | undefined>()

  const updateMovie = useMutation({
    mutationKey: movieKeys.detail(movieId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: movieKeys.detail(movieId) })
      const previousData = queryClient.getQueryData(movieKeys.detail(movieId))

      // remove local state so that server state is taken instead
      setComment(undefined)

      queryClient.setQueryData(movieKeys.detail(movieId), {
        ...previousData,
        movie: {
          ...previousData.movie,
          comment,
        },
      })

      return { previousData }
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(movieKeys.detail(movieId), context.previousData)
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
