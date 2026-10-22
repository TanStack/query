import { del, entries, get, set } from 'idb-keyval'
import { queryOptions } from '@tanstack/vue-query'
import { experimental_createQueryPersister } from '@tanstack/query-persist-client-core'
import type { Post } from './types'

const fetchPosts = async (): Promise<Array<Post>> => {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts')
  if (!response.ok) throw new Error('Failed to fetch posts')
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return await response.json()
}

const fetchPost = async (id: number): Promise<Post> => {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/posts/${id}`,
  )
  if (!response.ok) throw new Error('Failed to fetch post')
  return await response.json()
}

const postsPersister = experimental_createQueryPersister({
  storage: localStorage,
})

const postPersister = experimental_createQueryPersister({
  storage: {
    getItem: (key: string) => get(key),
    setItem: (key: string, value: string) => set(key, value),
    removeItem: (key: string) => del(key),
    entries: () => entries<string>(),
  },
})

export const postsQueryOptions = () =>
  queryOptions({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    persister: postsPersister.persisterFn,
    staleTime: 5000,
  })

export const postQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
    persister: postPersister.persisterFn,
  })
