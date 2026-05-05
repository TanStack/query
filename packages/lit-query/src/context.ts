import { createContext } from '@lit/context'
import type { QueryClient } from '@tanstack/query-core'

export const queryClientContext = createContext<QueryClient>(
  Symbol.for('tanstack-query-client'),
)

const missingQueryClientMessage =
  'No QueryClient available. Pass one explicitly or render within QueryClientProvider.'
const ambiguousQueryClientMessage =
  'Multiple QueryClients are mounted. Pass one explicitly instead of relying on global QueryClient helpers.'

const registeredClients = new Map<QueryClient, number>()
let defaultClient: QueryClient | undefined

export function registerDefaultQueryClient(client: QueryClient): void {
  registeredClients.set(client, (registeredClients.get(client) ?? 0) + 1)
  defaultClient = client
}

export function unregisterDefaultQueryClient(client: QueryClient): void {
  const count = registeredClients.get(client)
  if (count === undefined) {
    return
  }

  if (count > 1) {
    registeredClients.set(client, count - 1)
    return
  }

  registeredClients.delete(client)
  if (defaultClient !== client) {
    return
  }

  const remaining = [...registeredClients.keys()]
  defaultClient = remaining.at(-1)
}

export function getDefaultQueryClient(): QueryClient | undefined {
  if (registeredClients.size > 1) {
    return undefined
  }

  return defaultClient
}

export function createMissingQueryClientError(): Error {
  return new Error(missingQueryClientMessage)
}

function createAmbiguousQueryClientError(): Error {
  return new Error(ambiguousQueryClientMessage)
}

export function useQueryClient(): QueryClient {
  const client = getDefaultQueryClient()
  if (client) {
    return client
  }

  if (registeredClients.size > 1) {
    throw createAmbiguousQueryClientError()
  }

  throw createMissingQueryClientError()
}

export function resolveQueryClient(explicit?: QueryClient): QueryClient {
  return explicit ?? useQueryClient()
}
