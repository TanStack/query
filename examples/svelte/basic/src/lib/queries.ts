import { queryOptions } from '@tanstack/svelte-query'
import { getPostById, getPosts } from './data'

export const postsQueryOptions = (limit: number) =>
  queryOptions({
    queryKey: ['posts', limit],
    queryFn: () => getPosts(limit),
  })

export const postQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['post', id],
    queryFn: () => getPostById(id),
  })
