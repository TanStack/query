import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { onScopeDispose, reactive, ref } from 'vue-demi'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { useQuery } from '../useQuery'
import { useIsFetching } from '../useIsFetching'
import type { MockedFunction } from 'vitest'

vi.mock('../useQueryClient')

describe('useIsFetching', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should properly return isFetching state', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const { isFetching: isFetchingQuery } = useQuery({
      queryKey: key1,
      queryFn: () => sleep(0).then(() => 'Some data'),
    })
    useQuery({
      queryKey: key2,
      queryFn: () => sleep(0).then(() => 'Some data'),
    })
    const isFetching = useIsFetching()

    expect(isFetchingQuery.value).toStrictEqual(true)
    expect(isFetching.value).toStrictEqual(2)

    await vi.advanceTimersByTimeAsync(0)

    expect(isFetchingQuery.value).toStrictEqual(false)
    expect(isFetching.value).toStrictEqual(0)
  })

  it('should stop listening to changes on onScopeDispose', async () => {
    const key = queryKey()
    const onScopeDisposeMock = onScopeDispose as MockedFunction<
      typeof onScopeDispose
    >
    onScopeDisposeMock.mockImplementation((fn) => fn())

    const { status } = useQuery({
      queryKey: key,
      queryFn: () => sleep(0).then(() => 'Some data'),
    })
    const isFetching = useIsFetching()

    expect(status.value).toStrictEqual('pending')
    expect(isFetching.value).toStrictEqual(1)

    await vi.advanceTimersByTimeAsync(0)

    expect(status.value).toStrictEqual('pending')
    expect(isFetching.value).toStrictEqual(1)

    await vi.advanceTimersByTimeAsync(0)

    expect(status.value).toStrictEqual('pending')
    expect(isFetching.value).toStrictEqual(1)

    onScopeDisposeMock.mockReset()
  })

  it('should properly update filters', async () => {
    const key = queryKey()
    const filter = reactive({ stale: false, queryKey: key })
    useQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'Some data'),
    })
    const isFetching = useIsFetching(filter)

    expect(isFetching.value).toStrictEqual(0)

    filter.stale = true
    await vi.advanceTimersByTimeAsync(0)

    expect(isFetching.value).toStrictEqual(1)
  })

  it('should work with options getter and be reactive', async () => {
    const key = queryKey()
    const staleRef = ref(false)
    useQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'Some data'),
    })
    const isFetching = useIsFetching(() => ({
      stale: staleRef.value,
      queryKey: key,
    }))

    expect(isFetching.value).toStrictEqual(0)

    staleRef.value = true
    await vi.advanceTimersByTimeAsync(0)

    expect(isFetching.value).toStrictEqual(1)
  })

  it('should warn when used outside of setup function in development mode', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      useIsFetching()

      expect(warnSpy).toHaveBeenCalledWith(
        'vue-query composable like "useQuery()" should only be used inside a "setup()" function or a running effect scope. They might otherwise lead to memory leaks.',
      )
    } finally {
      warnSpy.mockRestore()
      vi.unstubAllEnvs()
    }
  })
})
