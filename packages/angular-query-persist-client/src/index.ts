// Re-export core
// oxlint-disable-next-line tanstack-query/no-restricted-syntax
export * from '@tanstack/query-persist-client-core'

export type {
  PersistQueryClientUserOptions,
  WithPersistQueryClientFn,
} from './with-persist-query-client'
export { withPersistQueryClient } from './with-persist-query-client'
