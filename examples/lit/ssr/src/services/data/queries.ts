import { queryOptions } from '@tanstack/lit-query'
import { dataAPI } from './api.js'

export const QUERY_STALE_TIME = 30000

export const dataQueries = {
  all: () => ['data'] as const,
  detail: (apiBaseUrl = '') =>
    queryOptions({
      queryKey: [...dataQueries.all(), 'detail', apiBaseUrl] as const,
      queryFn: ({ signal }) => dataAPI.getData(apiBaseUrl, signal),
      retry: false,
      staleTime: QUERY_STALE_TIME,
    }),
}
