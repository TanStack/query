import { createSignal } from 'solid-js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import * as api from './api'

export const movieKeys = {
  all: () => ['movies'],
  list: () => [...movieKeys.all(), 'list'],
  details: () => [...movieKeys.all(), 'detail'],
  detail: (id: string) => [...movieKeys.details(), id],
}

export const useMovie = (movieId: string) => {
  const queryClient = useQueryClient()

  const movieQuery = useQuery(() => ({
    queryKey: movieKeys.detail(movieId),
    queryFn: () => api.fetchMovie(movieId),
  }))

  const [comment, setComment] = createSignal<string | undefined>()

  const updateMovie = useMutation(() => ({
    mutationKey: movieKeys.detail(movieId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: movieKeys.detail(movieId) })
      const previousData = queryClient.getQueryData<
        Awaited<ReturnType<typeof api.fetchMovie>>
      >(movieKeys.detail(movieId))

      // remove local state so that server state is taken instead
      setComment(undefined)

      queryClient.setQueryData(movieKeys.detail(movieId), {
        ...previousData,
        movie: {
          ...previousData?.movie,
          comment: comment(),
        },
      })

      return { previousData }
    },
    onError: (_: any, __: any, context: any) => {
      queryClient.setQueryData(movieKeys.detail(movieId), context.previousData)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: movieKeys.detail(movieId) })
    },
  }))

  return {
    comment: () => comment() ?? movieQuery.data?.movie.comment,
    setComment,
    updateMovie,
    movieQuery,
  }
}
