import { vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { sleep } from '@tanstack/query-test-utils'
import type { QueryClientConfig } from '@tanstack/query-core'
import type { PersistedClient, Persister } from '../persist'

export function createQueryClient(config?: QueryClientConfig): QueryClient {
  return new QueryClient(config)
}

export function createMockPersister(): Persister {
  let storedState: PersistedClient | undefined

  return {
    persistClient(persistClient: PersistedClient) {
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

export function createSpyPersister(): Persister {
  return {
    persistClient: vi.fn(),
    restoreClient: vi.fn(),
    removeClient: vi.fn(),
  }
}
