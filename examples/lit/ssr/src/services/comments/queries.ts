import { queryOptions } from '@tanstack/lit-query'
import { commentsAPI } from './api'

export const commentsQueries = {
  all: () => ['comments'] as const,
  list: () =>
    queryOptions({
      queryKey: [...commentsQueries.all(), 'list'] as const,
      queryFn: () => commentsAPI.getComments(),
    }),
}
