import {
  queryOptions,
  experimental_streamedQuery as streamedQuery,
} from '@tanstack/preact-query'
import { messagesAPI } from './api'

export const messagesQueries = {
  all: () => ['messages'] as const,
  detail: (id: string, question: string) =>
    queryOptions({
      queryKey: [...messagesQueries.all(), 'detail', id, question] as const,
      queryFn: streamedQuery({
        streamFn: ({ signal }) => messagesAPI.getAnswer(question, signal),
      }),
      staleTime: Infinity,
    }),
}
