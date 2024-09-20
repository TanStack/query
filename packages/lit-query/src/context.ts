import { createContext } from '@lit/context'
import type { QueryClient } from '@tanstack/query-core'

export type { QueryClient } from '@tanstack/query-core'
export const QueryContext = createContext<QueryClient | undefined>(
  Symbol.for('tanstack-lit-query'),
)
