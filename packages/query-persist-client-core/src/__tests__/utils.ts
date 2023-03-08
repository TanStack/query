import type { QueryClientConfig } from '@tanstack/query-core'
import { QueryClient } from '@tanstack/query-core'
import type {
  Persister,
  PersistedClient,
} from '@tanstack/query-persist-client-core'
import { vi } from 'vitest'

export function createQueryClient(config?: QueryClientConfig): QueryClient {
  return new QueryClient(config)
}

export function sleep(timeout: number): Promise<void> {
  return new Promise((resolve, _reject) => {
    setTimeout(resolve, timeout)
  })
}

export const createMockPersister = (): Persister => {
  let storedState: PersistedClient | undefined

  return {
    async persistClient(persistClient: PersistedClient) {
      storedState = persistClient
    },
    async restoreClient() {
      await sleep(10)
      return storedState
    },
    removeClient() {
      storedState = undefined
    },
  }
}

export const createSpyablePersister = (): Persister => {
  return {
    persistClient: vi.fn(),
    restoreClient: vi.fn(),
    removeClient: vi.fn(),
  }
}
