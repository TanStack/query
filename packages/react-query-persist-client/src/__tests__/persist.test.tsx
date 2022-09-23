import { createQueryClient, sleep } from './utils'
import type { PersistedClient, Persister } from '../persist'
import { persistQueryClientSubscribe } from '../persist'

const createMockPersister = (): Persister => {
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

describe('persistQueryClientSubscribe', () => {
  test('should persist mutations', async () => {
    const queryClient = createQueryClient()

    const persister = createMockPersister()

    const unsubscribe = persistQueryClientSubscribe({
      queryClient,
      persister,
      dehydrateOptions: { shouldDehydrateMutation: () => true },
    })

    queryClient.getMutationCache().build(queryClient, {
      mutationFn: async (text: string) => text,
      variables: 'todo',
    })

    const result = await persister.restoreClient()

    expect(result?.clientState.mutations).toHaveLength(1)

    unsubscribe()
  })
})
