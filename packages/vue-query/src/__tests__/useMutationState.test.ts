import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue-demi'
import { createKey, sleep } from '@tanstack/query-test-utils'
import { useMutation } from '../useMutation'
import { useMutationState } from '../useMutationState'
import { useQueryClient } from '../useQueryClient'

vi.mock(import('../useQueryClient'))

describe('useMutationState', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return variables after calling mutate 1', () => {
    const key = createKey()
    const variables = 'foo123'

    const { mutate } = useMutation({
      mutationKey: key,
      mutationFn: (params: string) => sleep(0).then(() => params),
    })

    mutate(variables)

    const mutationState = useMutationState({
      filters: { mutationKey: key, status: 'pending' },
      select: (mutation) => mutation.state.variables,
    })

    expect(mutationState.value).toStrictEqual([variables])
  })

  it('should return variables after calling mutate 2', () => {
    const queryClient = useQueryClient()
    queryClient.clear()
    const key = createKey()
    const variables = 'bar234'

    const { mutate } = useMutation({
      mutationKey: key,
      mutationFn: (params: string) => sleep(0).then(() => params),
    })

    mutate(variables)

    const mutationState = useMutationState()

    expect(mutationState.value[0]?.variables).toStrictEqual(variables)
  })

  it('should work with options getter and be reactive', async () => {
    const key = createKey()
    const keyRef = ref('useMutationStateGetter2')
    const variables = 'foo123'

    const { mutate } = useMutation({
      mutationKey: key,
      mutationFn: (params: string) => sleep(10).then(() => params),
    })

    mutate(variables)

    const mutationState = useMutationState(() => ({
      filters: { mutationKey: [keyRef.value], status: 'pending' },
      select: (mutation) => mutation.state.variables,
    }))

    expect(mutationState.value).toStrictEqual([])

    keyRef.value = key[0]!
    await vi.advanceTimersByTimeAsync(0)
    expect(mutationState.value).toStrictEqual([variables])
  })
})
