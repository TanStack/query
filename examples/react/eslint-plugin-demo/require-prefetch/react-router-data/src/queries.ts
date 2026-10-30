import { queryOptions } from '@tanstack/react-query'

export interface Post {
  id: string
  title: string
  body: string
}

export interface User {
  id: string
  name: string
}

export interface Settings {
  theme: 'light' | 'dark'
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(`https://api.example.com${url}`)
  if (!response.ok) {
    throw new Response(response.statusText, { status: response.status })
  }
  return response.json() as Promise<T>
}

export const postListOptions = () =>
  queryOptions({
    queryKey: ['posts'],
    queryFn: () => fetchJson<Array<Post>>('/posts'),
  })

export const postOptions = (postId: string | undefined) =>
  queryOptions({
    queryKey: ['posts', postId],
    queryFn: () => fetchJson<Post>(`/posts/${postId}`),
  })

export const userOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: ['users', userId],
    queryFn: () => fetchJson<User>(`/users/${userId}`),
  })

export const settingsOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: ['users', userId, 'settings'],
    queryFn: () => fetchJson<Settings>(`/users/${userId}/settings`),
  })

export const teamOptions = () =>
  queryOptions({
    queryKey: ['team'],
    queryFn: () => fetchJson<Array<User>>('/team'),
  })

export const notificationsOptions = () =>
  queryOptions({
    queryKey: ['notifications'],
    queryFn: () =>
      fetchJson<Array<{ id: string; text: string }>>('/notifications'),
  })

export const billingOptions = () =>
  queryOptions({
    queryKey: ['billing'],
    queryFn: () => fetchJson<{ plan: string }>('/billing'),
  })
