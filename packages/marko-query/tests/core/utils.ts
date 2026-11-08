import { QueryClient, environmentManager } from '@tanstack/query-core'

/**
 * A client that counts mounts. `gcTime: Infinity` keeps tests from scheduling
 * gc timers that would hold the process open.
 */
export function createClient(): QueryClient {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false } },
  })
  const counted = client as QueryClient & { mounts: number }
  counted.mounts = 0
  const mount = client.mount.bind(client)
  const unmount = client.unmount.bind(client)
  client.mount = () => {
    counted.mounts++
    mount()
  }
  client.unmount = () => {
    counted.mounts--
    unmount()
  }
  return client
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
