import { infiniteQuery, query, suspenseQuery, useQuery } from '#adapter'

export function useBookQuery(options) {
  return useQuery(query(options))
}

export function useSuspenseBookQuery(options) {
  return useQuery(suspenseQuery(options))
}

export function useBookPages(options) {
  return useQuery(infiniteQuery(options))
}

export function useSuspenseBookPages(options) {
  return useQuery(suspenseQuery(infiniteQuery(options)))
}
