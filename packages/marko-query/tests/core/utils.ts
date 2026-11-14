import { QueryClient, environmentManager } from '@tanstack/query-core'

/** A client made by `createClient`, with the mount count it keeps. */
export type CountingClient = QueryClient & { mounts: number }

/**
 * A client that counts mounts. `gcTime: Infinity` keeps tests from scheduling
 * gc timers that would hold the process open.
 */
export function createClient(): CountingClient {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false } },
  }) as CountingClient
  client.mounts = 0
  const mount = client.mount.bind(client)
  const unmount = client.unmount.bind(client)
  client.mount = () => {
    client.mounts++
    mount()
  }
  client.unmount = () => {
    client.mounts--
    unmount()
  }
  return client
}

/**
 * Reads the mount count of a client made by `createClient`. `getQueryClient`
 * and `setQueryClient` are typed with core's `QueryClient`, so the count is not
 * on the type there.
 */
export function mountsOf(client: QueryClient): number {
  return (client as CountingClient).mounts
}

export function setServer(value: boolean): void {
  environmentManager.setIsServer(() => value)
}

export function resetShared(): void {
  const state = (
    globalThis as Record<symbol, { browserClient?: unknown } | undefined>
  )[Symbol.for('@tanstack/marko-query/state')]
  if (state) state.browserClient = undefined
}

export const sleep = (ms = 0) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))
