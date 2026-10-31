import { del, entries, get, set } from 'idb-keyval'
import { queryOptions } from '@tanstack/vue-query'
import { experimental_createQueryPersister } from '@tanstack/query-persist-client-core'
import { postsAPI } from './api'

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

export const postsQueries = {
  all: () => ['posts'] as const,
  list: () =>
    queryOptions({
      queryKey: [...postsQueries.all(), 'list'] as const,
      queryFn: () => postsAPI.getPosts(),
      persister: postsPersister.persisterFn,
      staleTime: 5000,
    }),
  detail: (id: number) =>
    queryOptions({
      queryKey: [...postsQueries.all(), 'detail', id] as const,
      queryFn: () => postsAPI.getPost(id),
      persister: postPersister.persisterFn,
    }),
}
