import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { QueryClient } from '@tanstack/query-core'
import { sleep } from '@tanstack/query-test-utils'
import {
  injectIsMutating,
  injectMutation,
  injectMutationState,
  mutationOptions,
} from '..'
import { flushQueryUpdates, setupTanStackQueryTestBed } from './test-utils'

describe('mutationOptions', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
    setupTanStackQueryTestBed(queryClient)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return the object received as a parameter without any modification (with mutationKey in mutationOptions)', () => {
    const object = {
      mutationKey: ['key'],
      mutationFn: () => sleep(10).then(() => 5),
    } as const

    expect(mutationOptions(object)).toStrictEqual(object)
  })

  it('should return the object received as a parameter without any modification (without mutationKey in mutationOptions)', () => {
    const object = {
      mutationFn: () => sleep(10).then(() => 5),
    } as const

    expect(mutationOptions(object)).toStrictEqual(object)
  })

  it('should return the number of fetching mutations when used with injectIsMutating (with mutationKey in mutationOptions)', async () => {
    const mutationOpts = mutationOptions({
      mutationKey: ['key'],
      mutationFn: () => sleep(50).then(() => 'data'),
    })

    const [mutation, isMutating] = TestBed.runInInjectionContext(() => [
      injectMutation(() => mutationOpts),
      injectIsMutating(),
    ])

    expect(isMutating()).toBe(0)

    mutation.mutate()
    expect(isMutating()).toBe(0)
    await flushQueryUpdates()
    expect(isMutating()).toBe(1)
    await vi.advanceTimersByTimeAsync(51)
    expect(isMutating()).toBe(0)
  })

  it('should return the number of fetching mutations when used with injectIsMutating (without mutationKey in mutationOptions)', async () => {
    const mutationOpts = mutationOptions({
      mutationFn: () => sleep(50).then(() => 'data'),
    })

    const [mutation, isMutating] = TestBed.runInInjectionContext(() => [
      injectMutation(() => mutationOpts),
      injectIsMutating(),
    ])

    expect(isMutating()).toBe(0)

    mutation.mutate()
    expect(isMutating()).toBe(0)
    await flushQueryUpdates()
    expect(isMutating()).toBe(1)
    await vi.advanceTimersByTimeAsync(51)
    expect(isMutating()).toBe(0)
  })

  it('should return the number of fetching mutations when used with injectIsMutating', async () => {
    const mutationOpts1 = mutationOptions({
      mutationKey: ['key'],
      mutationFn: () => sleep(50).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(50).then(() => 'data2'),
    })

    const [mutation1, mutation2, isMutating] = TestBed.runInInjectionContext(
      () => [
        injectMutation(() => mutationOpts1),
        injectMutation(() => mutationOpts2),
        injectIsMutating(),
      ],
    )

    expect(isMutating()).toBe(0)

    mutation1.mutate()
    mutation2.mutate()
    expect(isMutating()).toBe(0)
    await flushQueryUpdates()
    expect(isMutating()).toBe(2)
    await vi.advanceTimersByTimeAsync(51)
    expect(isMutating()).toBe(0)
  })

  it('should return the number of fetching mutations when used with injectIsMutating (filter mutationOpts1.mutationKey)', async () => {
    const mutationOpts1 = mutationOptions({
      mutationKey: ['key'],
      mutationFn: () => sleep(50).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(50).then(() => 'data2'),
    })

    const [mutation1, mutation2, isMutating] = TestBed.runInInjectionContext(
      () => [
        injectMutation(() => mutationOpts1),
        injectMutation(() => mutationOpts2),
        injectIsMutating({ mutationKey: mutationOpts1.mutationKey }),
      ],
    )

    expect(isMutating()).toBe(0)

    mutation1.mutate()
    mutation2.mutate()
    expect(isMutating()).toBe(0)
    await flushQueryUpdates()
    expect(isMutating()).toBe(1)
    await vi.advanceTimersByTimeAsync(51)
    expect(isMutating()).toBe(0)
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating (with mutationKey in mutationOptions)', async () => {
    const mutationOpts = mutationOptions({
      mutationKey: ['mutation'],
      mutationFn: () => sleep(500).then(() => 'data'),
    })

    const mutation = TestBed.runInInjectionContext(() =>
      injectMutation(() => mutationOpts),
    )

    expect(queryClient.isMutating(mutationOpts)).toBe(0)

    mutation.mutate()
    expect(queryClient.isMutating(mutationOpts)).toBe(1)
    await vi.advanceTimersByTimeAsync(501)
    expect(queryClient.isMutating(mutationOpts)).toBe(0)
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating (without mutationKey in mutationOptions)', async () => {
    const mutationOpts = mutationOptions({
      mutationFn: () => sleep(500).then(() => 'data'),
    })

    const mutation = TestBed.runInInjectionContext(() =>
      injectMutation(() => mutationOpts),
    )

    expect(queryClient.isMutating()).toBe(0)

    mutation.mutate()
    expect(queryClient.isMutating()).toBe(1)
    await vi.advanceTimersByTimeAsync(501)
    expect(queryClient.isMutating()).toBe(0)
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating', async () => {
    const mutationOpts1 = mutationOptions({
      mutationKey: ['mutation'],
      mutationFn: () => sleep(500).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(500).then(() => 'data2'),
    })

    const [mutation1, mutation2] = TestBed.runInInjectionContext(() => [
      injectMutation(() => mutationOpts1),
      injectMutation(() => mutationOpts2),
    ])

    expect(queryClient.isMutating()).toBe(0)

    mutation1.mutate()
    mutation2.mutate()
    expect(queryClient.isMutating()).toBe(2)
    await vi.advanceTimersByTimeAsync(501)
    expect(queryClient.isMutating()).toBe(0)
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating (filter mutationOpt1.mutationKey)', async () => {
    const mutationOpts1 = mutationOptions({
      mutationKey: ['mutation'],
      mutationFn: () => sleep(500).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(500).then(() => 'data2'),
    })

    const [mutation1, mutation2] = TestBed.runInInjectionContext(() => [
      injectMutation(() => mutationOpts1),
      injectMutation(() => mutationOpts2),
    ])

    expect(
      queryClient.isMutating({ mutationKey: mutationOpts1.mutationKey }),
    ).toBe(0)

    mutation1.mutate()
    mutation2.mutate()
    expect(
      queryClient.isMutating({ mutationKey: mutationOpts1.mutationKey }),
    ).toBe(1)
    await vi.advanceTimersByTimeAsync(501)
    expect(
      queryClient.isMutating({ mutationKey: mutationOpts1.mutationKey }),
    ).toBe(0)
  })

  it('should return the number of fetching mutations when used with injectMutationState (with mutationKey in mutationOptions)', async () => {
    const mutationOpts = mutationOptions({
      mutationKey: ['mutation'],
      mutationFn: () => sleep(10).then(() => 'data'),
    })

    const [mutation, mutationState] = TestBed.runInInjectionContext(() => [
      injectMutation(() => mutationOpts),
      injectMutationState(() => ({
        filters: { mutationKey: mutationOpts.mutationKey, status: 'success' },
      })),
    ])

    expect(mutationState().length).toBe(0)

    mutation.mutate()
    await vi.advanceTimersByTimeAsync(11)
    expect(mutationState().length).toBe(1)
    expect(mutationState()[0]?.data).toBe('data')
  })

  it('should return the number of fetching mutations when used with injectMutationState (without mutationKey in mutationOptions)', async () => {
    const mutationOpts = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data'),
    })

    const [mutation, mutationState] = TestBed.runInInjectionContext(() => [
      injectMutation(() => mutationOpts),
      injectMutationState(() => ({
        filters: { status: 'success' },
      })),
    ])

    expect(mutationState().length).toBe(0)

    mutation.mutate()
    await vi.advanceTimersByTimeAsync(11)
    expect(mutationState().length).toBe(1)
    expect(mutationState()[0]?.data).toBe('data')
  })

  it('should return the number of fetching mutations when used with injectMutationState', async () => {
    const mutationOpts1 = mutationOptions({
      mutationKey: ['mutation'],
      mutationFn: () => sleep(10).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data2'),
    })

    const [mutation1, mutation2, mutationState] = TestBed.runInInjectionContext(
      () => [
        injectMutation(() => mutationOpts1),
        injectMutation(() => mutationOpts2),
        injectMutationState(() => ({
          filters: { status: 'success' },
        })),
      ],
    )

    expect(mutationState().length).toBe(0)

    mutation1.mutate()
    mutation2.mutate()
    await vi.advanceTimersByTimeAsync(11)
    expect(mutationState().length).toBe(2)
    expect(mutationState()[0]?.data).toBe('data1')
    expect(mutationState()[1]?.data).toBe('data2')
  })

  it('should return the number of fetching mutations when used with injectMutationState (filter mutationOpt1.mutationKey)', async () => {
    const mutationOpts1 = mutationOptions({
      mutationKey: ['mutation'],
      mutationFn: () => sleep(10).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data2'),
    })

    const [mutation1, mutation2, mutationState] = TestBed.runInInjectionContext(
      () => [
        injectMutation(() => mutationOpts1),
        injectMutation(() => mutationOpts2),
        injectMutationState(() => ({
          filters: {
            mutationKey: mutationOpts1.mutationKey,
            status: 'success',
          },
        })),
      ],
    )

    expect(mutationState().length).toBe(0)

    mutation1.mutate()
    mutation2.mutate()
    await vi.advanceTimersByTimeAsync(11)
    expect(mutationState().length).toBe(1)
    expect(mutationState()[0]?.data).toBe('data1')
  })
})
