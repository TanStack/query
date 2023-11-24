// Re-export core
export * from '@tanstack/query-core'

export * as QueryClientProvider from './QueryClientProvider'

export { useQuery } from './useQuery'
export { useQueries } from './useQueries'

export { useInfiniteQuery } from './useInfiniteQuery'
export { useIsFetching } from './useIsFetching'

export { useMutation } from './useMutation'
export { useIsMutating } from './useIsMutating'

export { queryClientState } from './utils'
export { createQueryClient } from './useQueryClient'
