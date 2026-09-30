import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { LitElement } from 'lit'
import { createMutationController } from '../createMutationController.js'
import { mutationOptions } from '../mutationOptions.js'
import { useIsMutating } from '../useIsMutating.js'
import { useMutationState } from '../useMutationState.js'
import { generateElementName } from './utils.js'
import type { CreateMutationOptions } from '../createMutationController.js'

describe('mutationOptions', () => {
  let queryClient: QueryClient
  let container: HTMLElement

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
    container = document.createElement('div')
    document.body.append(container)
  })

  afterEach(() => {
    container.remove()
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should return the object received as a parameter without any modification (with mutationKey in mutationOptions)', () => {
    const object: CreateMutationOptions = {
      mutationKey: ['key'],
      mutationFn: () => sleep(10).then(() => 5),
    } as const

    expect(mutationOptions(object)).toBe(object)
  })

  it('should return the object received as a parameter without any modification (without mutationKey in mutationOptions)', () => {
    const object: CreateMutationOptions = {
      mutationFn: () => sleep(10).then(() => 5),
    } as const

    expect(mutationOptions(object)).toBe(object)
  })

  it('should return the number of fetching mutations when used with useIsMutating (with mutationKey in mutationOptions)', async () => {
    const mutationOpts = mutationOptions({
      mutationKey: queryKey(),
      mutationFn: () => sleep(10).then(() => 'data'),
    })

    class Host extends LitElement {
      readonly mutation1 = createMutationController(
        this,
        mutationOpts,
        queryClient,
      )

      readonly isMutating = useIsMutating(this, {}, queryClient)
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)

    expect(host.isMutating()).toBe(0)

    host.mutation1.mutate()
    await vi.advanceTimersByTimeAsync(0)
    expect(host.isMutating()).toBe(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(host.isMutating()).toBe(0)
  })

  it('should return the number of fetching mutations when used with useIsMutating (without mutationKey in mutationOptions)', async () => {
    const mutationOpts = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data'),
    })

    class Host extends LitElement {
      readonly mutation1 = createMutationController(
        this,
        mutationOpts,
        queryClient,
      )

      readonly isMutating = useIsMutating(this, {}, queryClient)
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)

    expect(host.isMutating()).toBe(0)

    host.mutation1.mutate()
    await vi.advanceTimersByTimeAsync(0)
    expect(host.isMutating()).toBe(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(host.isMutating()).toBe(0)
  })

  it('should return the number of fetching mutations when used with useIsMutating', async () => {
    const mutationOpts1 = mutationOptions({
      mutationKey: queryKey(),
      mutationFn: () => sleep(10).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data2'),
    })

    class Host extends LitElement {
      readonly mutation1 = createMutationController(
        this,
        mutationOpts1,
        queryClient,
      )
      readonly mutation2 = createMutationController(
        this,
        mutationOpts2,
        queryClient,
      )

      readonly isMutating = useIsMutating(this, {}, queryClient)
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)

    expect(host.isMutating()).toBe(0)

    host.mutation1.mutate()
    host.mutation2.mutate()
    await vi.advanceTimersByTimeAsync(0)
    expect(host.isMutating()).toBe(2)
    await vi.advanceTimersByTimeAsync(10)
    expect(host.isMutating()).toBe(0)
  })

  it('should return the number of fetching mutations when used with useIsMutating (filter mutationOpts1.mutationKey)', async () => {
    const mutationOpts1 = mutationOptions({
      mutationKey: queryKey(),
      mutationFn: () => sleep(10).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data2'),
    })

    class Host extends LitElement {
      readonly mutation1 = createMutationController(
        this,
        mutationOpts1,
        queryClient,
      )
      readonly mutation2 = createMutationController(
        this,
        mutationOpts2,
        queryClient,
      )

      readonly isMutating = useIsMutating(
        this,
        { mutationKey: mutationOpts1.mutationKey },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)

    expect(host.isMutating()).toBe(0)

    host.mutation1.mutate()
    host.mutation2.mutate()
    await vi.advanceTimersByTimeAsync(0)
    expect(host.isMutating()).toBe(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(host.isMutating()).toBe(0)
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating (with mutationKey in mutationOptions)', async () => {
    const mutationOpts = mutationOptions({
      mutationKey: queryKey(),
      mutationFn: () => sleep(10).then(() => 'data'),
    })

    class Host extends LitElement {
      readonly mutation1 = createMutationController(
        this,
        mutationOpts,
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)

    expect(queryClient.isMutating(mutationOpts)).toBe(0)

    host.mutation1.mutate()
    expect(queryClient.isMutating(mutationOpts)).toBe(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(queryClient.isMutating(mutationOpts)).toBe(0)
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating (without mutationKey in mutationOptions)', async () => {
    const mutationOpts = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data'),
    })

    class Host extends LitElement {
      readonly mutation1 = createMutationController(
        this,
        mutationOpts,
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)

    expect(queryClient.isMutating()).toBe(0)

    host.mutation1.mutate()
    expect(queryClient.isMutating()).toBe(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(queryClient.isMutating()).toBe(0)
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating', async () => {
    const mutationOpts1 = mutationOptions({
      mutationKey: queryKey(),
      mutationFn: () => sleep(10).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data2'),
    })

    class Host extends LitElement {
      readonly mutation1 = createMutationController(
        this,
        mutationOpts1,
        queryClient,
      )
      readonly mutation2 = createMutationController(
        this,
        mutationOpts2,
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)

    expect(queryClient.isMutating()).toBe(0)

    host.mutation1.mutate()
    host.mutation2.mutate()
    expect(queryClient.isMutating()).toBe(2)
    await vi.advanceTimersByTimeAsync(10)
    expect(queryClient.isMutating()).toBe(0)
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating (filter mutationOpts1.mutationKey)', async () => {
    const mutationOpts1 = mutationOptions({
      mutationKey: queryKey(),
      mutationFn: () => sleep(10).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data2'),
    })

    class Host extends LitElement {
      readonly mutation1 = createMutationController(
        this,
        mutationOpts1,
        queryClient,
      )
      readonly mutation2 = createMutationController(
        this,
        mutationOpts2,
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)

    expect(
      queryClient.isMutating({ mutationKey: mutationOpts1.mutationKey }),
    ).toBe(0)

    host.mutation1.mutate()
    host.mutation2.mutate()
    expect(
      queryClient.isMutating({ mutationKey: mutationOpts1.mutationKey }),
    ).toBe(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(
      queryClient.isMutating({ mutationKey: mutationOpts1.mutationKey }),
    ).toBe(0)
  })

  it('should return the number of fetching mutations when used with useMutationState (with mutationKey in mutationOptions)', async () => {
    const mutationOpts = mutationOptions({
      mutationKey: queryKey(),
      mutationFn: () => sleep(10).then(() => 'data'),
    })

    class Host extends LitElement {
      readonly mutation1 = createMutationController(
        this,
        mutationOpts,
        queryClient,
      )

      readonly mutationStates = useMutationState(
        this,
        {
          filters: { mutationKey: mutationOpts.mutationKey, status: 'success' },
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)

    expect(host.mutationStates()).toHaveLength(0)

    host.mutation1.mutate()
    await vi.advanceTimersByTimeAsync(10)
    expect(host.mutationStates()).toHaveLength(1)
    expect(host.mutationStates()[0]?.data).toBe('data')
  })

  it('should return the number of fetching mutations when used with useMutationState (without mutationKey in mutationOptions)', async () => {
    const mutationOpts = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data'),
    })

    class Host extends LitElement {
      readonly mutation1 = createMutationController(
        this,
        mutationOpts,
        queryClient,
      )

      readonly mutationStates = useMutationState(
        this,
        { filters: { status: 'success' } },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)

    expect(host.mutationStates()).toHaveLength(0)

    host.mutation1.mutate()
    await vi.advanceTimersByTimeAsync(10)
    expect(host.mutationStates()).toHaveLength(1)
    expect(host.mutationStates()[0]?.data).toBe('data')
  })

  it('should return the number of fetching mutations when used with useMutationState', async () => {
    const mutationOpts1 = mutationOptions({
      mutationKey: queryKey(),
      mutationFn: () => sleep(10).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data2'),
    })

    class Host extends LitElement {
      readonly mutation1 = createMutationController(
        this,
        mutationOpts1,
        queryClient,
      )
      readonly mutation2 = createMutationController(
        this,
        mutationOpts2,
        queryClient,
      )

      readonly mutationStates = useMutationState(
        this,
        { filters: { status: 'success' } },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)

    expect(host.mutationStates()).toHaveLength(0)

    host.mutation1.mutate()
    host.mutation2.mutate()
    await vi.advanceTimersByTimeAsync(10)
    expect(host.mutationStates()).toHaveLength(2)
    expect(host.mutationStates()[0]?.data).toBe('data1')
    expect(host.mutationStates()[1]?.data).toBe('data2')
  })

  it('should return the number of fetching mutations when used with useMutationState (filter mutationOpts1.mutationKey)', async () => {
    const mutationOpts1 = mutationOptions({
      mutationKey: queryKey(),
      mutationFn: () => sleep(10).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data2'),
    })

    class Host extends LitElement {
      readonly mutation1 = createMutationController(
        this,
        mutationOpts1,
        queryClient,
      )
      readonly mutation2 = createMutationController(
        this,
        mutationOpts2,
        queryClient,
      )

      readonly mutationStates = useMutationState(
        this,
        {
          filters: {
            mutationKey: mutationOpts1.mutationKey,
            status: 'success',
          },
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)

    expect(host.mutationStates()).toHaveLength(0)

    host.mutation1.mutate()
    host.mutation2.mutate()
    await vi.advanceTimersByTimeAsync(10)
    expect(host.mutationStates()).toHaveLength(1)
    expect(host.mutationStates()[0]?.data).toBe('data1')
  })
})
