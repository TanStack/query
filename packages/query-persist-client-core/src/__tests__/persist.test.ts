import { QueriesObserver } from '@tanstack/query-core'
import { persistQueryClientSubscribe } from '../persist'
import {
  createMockPersister,
  createQueryClient,
  createSpyablePersister,
} from './utils'

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

describe('persistQueryClientSave', () => {
  test('should not be triggered on observer type events', async () => {
    const queryClient = createQueryClient()

    const persister = createSpyablePersister()

    const unsubscribe = persistQueryClientSubscribe({
      queryClient,
      persister,
    })

    const queryKey = ['test']
    const queryFn = jest.fn().mockReturnValue(1)
    const observer = new QueriesObserver(queryClient, [{ queryKey, queryFn }])
    const unsubscribeObserver = observer.subscribe(jest.fn())
    observer.getObservers()[0]?.setOptions({ refetchOnWindowFocus: false })
    unsubscribeObserver()

    queryClient.setQueryData(queryKey, 2)

    // persistClient should be called 3 times:
    // 1. When query is added
    // 2. When queryFn is resolved
    // 3. When setQueryData is called
    // All events fired by manipulating observers are ignored
    expect(persister.persistClient).toHaveBeenCalledTimes(3)

    unsubscribe()
  })
})
