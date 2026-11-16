import { queryOptions } from '@tanstack/svelte-query'
import { postsAPI } from './api'

export const postsQueries = {
  all: () => ['posts'] as const,
  list: () =>
    queryOptions({
      queryKey: [...postsQueries.all(), 'list'] as const,
      queryFn: () => postsAPI.getPosts(),
    }),
  detail: (postId: string) =>
    queryOptions({
      queryKey: [...postsQueries.all(), 'detail', postId] as const,
      queryFn: () => postsAPI.getPost(postId),
    }),
}
