import { createContext } from '@lit/context'
import type { QueryClient } from '@tanstack/query-core'

/**
 * Lit context key used by `QueryClientProvider` and host-bound APIs to share a
 * `QueryClient` through the DOM tree.
 *
 * Most applications use `QueryClientProvider` instead of interacting with this
 * context directly.
 */
export const queryClientContext = createContext<QueryClient>(
  Symbol.for('tanstack-query-client'),
)

const missingQueryClientMessage =
  'No QueryClient available. Pass one explicitly or render within QueryClientProvider.'
const ambiguousQueryClientMessage =
  'Multiple QueryClients are mounted. Pass one explicitly instead of relying on global QueryClient helpers.'

const registeredClients = new Map<QueryClient, number>()
let defaultClient: QueryClient | undefined

/**
 * Registers a `QueryClient` as a process-local fallback for APIs that resolve a
 * client without an explicit argument.
 *
 * `QueryClientProvider` calls this automatically while it is connected. Prefer
 * passing an explicit client or rendering under a provider when possible.
 *
 * @param client - The query client to register as the current default.
 */
export function registerDefaultQueryClient(client: QueryClient): void {
  registeredClients.set(client, (registeredClients.get(client) ?? 0) + 1)
  defaultClient = client
}

/**
 * Unregisters a client previously registered with
 * `registerDefaultQueryClient`.
 *
 * `QueryClientProvider` calls this automatically when it disconnects.
 *
 * @param client - The query client registration to release.
 */
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

/**
 * Returns the registered default `QueryClient`, if exactly one default client is
 * available.
 *
 * @returns The default query client, or `undefined` when there is no registered
 * client or more than one registered client.
 */
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

/**
 * Resolves the current default `QueryClient` registered by a connected
 * `QueryClientProvider`.
 *
 * This helper is useful outside a Lit reactive controller when a single
 * provider is mounted. It throws if no client is registered or if multiple
 * clients are mounted and the default would be ambiguous.
 *
 * @returns The single registered query client.
 */
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

/**
 * Resolves an explicit `QueryClient` or falls back to `useQueryClient`.
 *
 * @param explicit - Optional client supplied by the caller.
 * @returns The explicit client when provided, otherwise the current default
 * client.
 */
export function resolveQueryClient(explicit?: QueryClient): QueryClient {
  return explicit ?? useQueryClient()
}
