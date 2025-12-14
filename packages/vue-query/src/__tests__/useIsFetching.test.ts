import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { onScopeDispose, reactive, ref } from 'vue-demi'
import { sleep } from '@tanstack/query-test-utils'
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

  test('should properly return isFetching state', async () => {
    const { isFetching: isFetchingQuery } = useQuery({
      queryKey: ['isFetching1'],
      queryFn: () => sleep(0).then(() => 'Some data'),
    })
    useQuery({
      queryKey: ['isFetching2'],
      queryFn: () => sleep(0).then(() => 'Some data'),
    })
    const isFetching = useIsFetching()

    expect(isFetchingQuery.value).toStrictEqual(true)
    expect(isFetching.value).toStrictEqual(2)

    await vi.advanceTimersByTimeAsync(0)

    expect(isFetchingQuery.value).toStrictEqual(false)
    expect(isFetching.value).toStrictEqual(0)
  })

  test('should stop listening to changes on onScopeDispose', async () => {
    const onScopeDisposeMock = onScopeDispose as MockedFunction<
      typeof onScopeDispose
    >
    onScopeDisposeMock.mockImplementation((fn) => fn())

    const { status } = useQuery({
      queryKey: ['onScopeDispose'],
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

  test('should properly update filters', async () => {
    const filter = reactive({ stale: false, queryKey: ['isFetchingFilter'] })
    useQuery({
      queryKey: ['isFetchingFilter'],
      queryFn: () => sleep(10).then(() => 'Some data'),
    })
    const isFetching = useIsFetching(filter)

    expect(isFetching.value).toStrictEqual(0)

    filter.stale = true
    await vi.advanceTimersByTimeAsync(0)

    expect(isFetching.value).toStrictEqual(1)
  })

  test('should work with options getter and be reactive', async () => {
    const staleRef = ref(false)
    useQuery({
      queryKey: ['isFetchingGetter'],
      queryFn: () => sleep(10).then(() => 'Some data'),
    })
    const isFetching = useIsFetching(() => ({
      stale: staleRef.value,
      queryKey: ['isFetchingGetter'],
    }))

    expect(isFetching.value).toStrictEqual(0)

    staleRef.value = true
    await vi.advanceTimersByTimeAsync(0)

    expect(isFetching.value).toStrictEqual(1)
  })
})
