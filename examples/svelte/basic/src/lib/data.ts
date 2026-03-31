import type { Post } from './types'

export const getPosts = async (limit: number) => {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts')
  const data = (await response.json()) as Array<Post>
  return data.filter((x) => x.id <= limit)
}

export const getPostById = async (id: number): Promise<Post> => {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/posts/${id}`,
  )
  const data = (await response.json()) as Post
  return data
}
