import { queryOptions } from '@tanstack/solid-query'
import { postsAPI } from './api'

export const postsQueries = {
  all: () => ['posts'] as const,
  detail: ({
    postId,
    sleep,
    simulateError,
  }: {
    postId: number
    sleep?: number
    simulateError?: boolean
  }) =>
    queryOptions({
      queryKey: [
        ...postsQueries.all(),
        'detail',
        postId,
        sleep,
        simulateError,
      ] as const,
      queryFn: () => postsAPI.getPost({ postId, sleep, simulateError }),
    }),
}
