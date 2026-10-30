import { QueryClient, queryOptions } from '@tanstack/react-query'

// One query client for the browser, shared by every `clientLoader` and the app's provider.
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60 * 1000 } },
})

export interface Post {
  id: string
  title: string
  body: string
  authorId: string
}

export interface User {
  id: string
  name: string
}

export interface Comment {
  id: string
  body: string
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(`https://api.example.com${url}`)
  if (!response.ok) {
    throw new Response(response.statusText, { status: response.status })
  }
  return response.json() as Promise<T>
}

export const postOptions = (postId: string | undefined) =>
  queryOptions({
    queryKey: ['posts', postId],
    queryFn: () => fetchJson<Post>(`/posts/${postId}`),
  })

export const commentsOptions = (postId: string | undefined) =>
  queryOptions({
    queryKey: ['posts', postId, 'comments'],
    queryFn: () => fetchJson<Array<Comment>>(`/posts/${postId}/comments`),
  })

export const userOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: ['users', userId],
    queryFn: () => fetchJson<User>(`/users/${userId}`),
  })

export const userPostsOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: ['users', userId, 'posts'],
    queryFn: () => fetchJson<Array<Post>>(`/users/${userId}/posts`),
  })

export const searchOptions = (q: string | null) =>
  queryOptions({
    queryKey: ['search', q],
    queryFn: () => fetchJson<Array<Post>>(`/search?q=${q ?? ''}`),
  })

export const feedOptions = (page: number) =>
  queryOptions({
    queryKey: ['feed', page],
    queryFn: () => fetchJson<Array<Post>>(`/feed?page=${page}`),
  })

export const currentUserOptions = queryOptions({
  queryKey: ['me'],
  queryFn: () => fetchJson<User>('/me'),
})
