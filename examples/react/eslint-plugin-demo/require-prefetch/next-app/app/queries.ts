import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

const api = 'https://api.example.com'

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${api}${path}`)
  if (!response.ok) throw new Error(`Failed to fetch ${path}`)
  return response.json()
}

export type Post = { id: string; title: string; body: string }
export type Comment = { id: string; body: string }
export type User = { id: string; name: string }

export const postOptions = (id: string) =>
  queryOptions({
    queryKey: ['posts', id],
    queryFn: () => get<Post>(`/posts/${id}`),
  })

export const commentsOptions = (postId: string) =>
  queryOptions({
    queryKey: ['posts', postId, 'comments'],
    queryFn: () => get<Array<Comment>>(`/posts/${postId}/comments`),
  })

export const userOptions = (id: string) =>
  queryOptions({
    queryKey: ['users', id],
    queryFn: () => get<User>(`/users/${id}`),
  })

export const currentUserOptions = queryOptions({
  queryKey: ['me'],
  queryFn: () => get<User>('/me'),
})

export const feedOptions = infiniteQueryOptions({
  queryKey: ['feed'],
  queryFn: ({ pageParam }) => get<Array<Post>>(`/feed?page=${pageParam}`),
  initialPageParam: 1,
  getNextPageParam: (lastPage, _pages, lastPageParam) =>
    lastPage.length ? lastPageParam + 1 : undefined,
})

export const todosOptions = (filter: 'all' | 'open' | 'done') =>
  queryOptions({
    queryKey: ['todos', filter],
    queryFn: () =>
      get<Array<{ id: string; title: string }>>(`/todos?filter=${filter}`),
  })

export const searchOptions = (q: string | null | undefined) =>
  queryOptions({
    queryKey: ['search', q],
    queryFn: () => get<Array<Post>>(`/search?q=${q ?? ''}`),
  })

export const messagesOptions = queryOptions({
  queryKey: ['messages'],
  queryFn: () => get<Array<{ id: string; subject: string }>>('/messages'),
})

export const cartOptions = queryOptions({
  queryKey: ['cart'],
  queryFn: () => get<{ count: number }>('/cart'),
})

export const productsOptions = queryOptions({
  queryKey: ['products'],
  queryFn: () => get<Array<{ slug: string; name: string }>>('/products'),
})

export const reportOptions = queryOptions({
  queryKey: ['reports', 'monthly'],
  queryFn: () =>
    get<Array<{ month: string; revenue: number }>>('/reports/monthly'),
})
