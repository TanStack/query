import { queryOptions } from '@tanstack/svelte-query'
import { api } from './api'

export const postsQueryOptions = (limit: number, customFetch?: typeof fetch) =>
  queryOptions({
    queryKey: ['posts', limit],
    queryFn: () => api(customFetch).getPosts(limit),
  })

export const postQueryOptions = (id: number, customFetch?: typeof fetch) =>
  queryOptions({
    queryKey: ['post', id],
    queryFn: () => api(customFetch).getPostById(id),
  })
