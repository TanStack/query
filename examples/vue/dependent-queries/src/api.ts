import { queryOptions, skipToken } from '@tanstack/vue-query'
import type { Author, Post } from './types'

const fetchPosts = async (): Promise<Array<Post>> => {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts')
  if (!response.ok) throw new Error('Failed to fetch posts')
  return await response.json()
}

const fetchPost = async (id: number): Promise<Post> => {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/posts/${id}`,
  )
  if (!response.ok) throw new Error('Failed to fetch post')
  return await response.json()
}

const fetchAuthor = async (id: number): Promise<Author> => {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/users/${id}`,
  )
  if (!response.ok) throw new Error('Failed to fetch author')
  return await response.json()
}

export const postsQueryOptions = () =>
  queryOptions({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  })

export const postQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
  })

export const authorQueryOptions = (id: number | undefined) =>
  queryOptions({
    queryKey: ['author', id],
    queryFn: id === undefined ? skipToken : () => fetchAuthor(id),
  })
