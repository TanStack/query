import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createComputed, createRoot, createSignal } from 'solid-js'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  QueryClient,
  useIsFetching,
  useIsMutating,
  useMutation,
  useMutationState,
  useQueries,
  useQuery,
} from '..'

/**
 * Every hook seeds its state from the current client and options before handing
 * later changes to an observer. Those initial reads are one-shot by design, so
 * they must not register as dependencies of whatever is running when the hook is
 * called — Solid's `STRICT_READ_UNTRACKED` diagnostics report them, and a caller
 * inside a tracking scope gets its computation re-run and its hook rebuilt.
 *
 * Each test calls a hook inside a computation that reads nothing itself, then
 * invalidates the sources the hook read. The computation must not re-run.
 */
function countRunsOf(run: () => void) {
  let runs = 0
  const dispose = createRoot((disposeRoot) => {
    createComputed(() => {
      runs++
      run()
    })
    return disposeRoot
  })
  return { runs: () => runs, dispose }
}

describe('untracked reads', () => {
  let queryClient: QueryClient
  let otherClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
    otherClient = new QueryClient()
  })

  afterEach(() => {
    queryClient.clear()
    otherClient.clear()
    vi.useRealTimers()
  })

  it('should not track the reads useQuery makes while creating its observer', () => {
    const [client, setClient] = createSignal(queryClient)
    const [key, setKey] = createSignal(queryKey())

    const { runs, dispose } = countRunsOf(() => {
      useQuery(
        () => ({
          queryKey: key(),
          queryFn: () => sleep(10).then(() => 'data'),
        }),
        client,
      )
    })

    expect(runs()).toBe(1)

    setKey(queryKey())
    setClient(otherClient)

    expect(runs()).toBe(1)
    dispose()
  })

  it('should not track the reads useQueries makes while creating its observer', () => {
    const [client, setClient] = createSignal(queryClient)
    const [key, setKey] = createSignal(queryKey())

    const { runs, dispose } = countRunsOf(() => {
      useQueries(
        () => ({
          queries: [
            { queryKey: key(), queryFn: () => sleep(10).then(() => 'data') },
          ],
        }),
        client,
      )
    })

    expect(runs()).toBe(1)

    setKey(queryKey())
    setClient(otherClient)

    expect(runs()).toBe(1)
    dispose()
  })

  it('should not track the reads useMutation makes while creating its observer', () => {
    const [client, setClient] = createSignal(queryClient)
    const [key, setKey] = createSignal(queryKey())

    const { runs, dispose } = countRunsOf(() => {
      useMutation(
        () => ({
          mutationKey: key(),
          mutationFn: () => Promise.resolve('data'),
        }),
        client,
      )
    })

    expect(runs()).toBe(1)

    setKey(queryKey())
    setClient(otherClient)

    expect(runs()).toBe(1)
    dispose()
  })

  it('should not track the reads useIsFetching makes while seeding its result', () => {
    const [client, setClient] = createSignal(queryClient)
    const [key, setKey] = createSignal(queryKey())

    const { runs, dispose } = countRunsOf(() => {
      useIsFetching(() => ({ queryKey: key() }), client)
    })

    expect(runs()).toBe(1)

    setKey(queryKey())
    setClient(otherClient)

    expect(runs()).toBe(1)
    dispose()
  })

  it('should not track the reads useIsMutating makes while seeding its result', () => {
    const [client, setClient] = createSignal(queryClient)
    const [key, setKey] = createSignal(queryKey())

    const { runs, dispose } = countRunsOf(() => {
      useIsMutating(() => ({ mutationKey: key() }), client)
    })

    expect(runs()).toBe(1)

    setKey(queryKey())
    setClient(otherClient)

    expect(runs()).toBe(1)
    dispose()
  })

  it('should not track the reads useMutationState makes while seeding its result', () => {
    const [client, setClient] = createSignal(queryClient)
    const [key, setKey] = createSignal(queryKey())

    const { runs, dispose } = countRunsOf(() => {
      useMutationState(() => ({ filters: { mutationKey: key() } }), client)
    })

    expect(runs()).toBe(1)

    setKey(queryKey())
    setClient(otherClient)

    expect(runs()).toBe(1)
    dispose()
  })
})
