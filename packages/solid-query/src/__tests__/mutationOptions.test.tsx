import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@solidjs/testing-library'
import { createEffect, createRenderEffect } from 'solid-js'
import { sleep } from '@tanstack/query-test-utils'
import {
  QueryClient,
  QueryClientProvider,
  useIsMutating,
  useMutation,
  useMutationState,
} from '..'
import { mutationOptions } from '../mutationOptions'
import type { MutationState } from '@tanstack/query-core'

describe('mutationOptions', () => {
  beforeEach(() => {
    vi.useFakeTimers()
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

  it('should return the number of fetching mutations when used with useIsMutating (with mutationKey in mutationOptions)', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = new QueryClient()
    const mutationOpts = mutationOptions({
      mutationKey: ['key'],
      mutationFn: () => sleep(50).then(() => 'data'),
    })

    function Mutation() {
      const isMutating = useIsMutating()
      const { mutate } = useMutation(() => mutationOpts)

      createRenderEffect(() => {
        isMutatingArray.push(isMutating())
      })

      return (
        <div>
          <button onClick={() => mutate()}>mutate</button>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Mutation />
      </QueryClientProvider>
    ))

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    expect(isMutatingArray[0]).toEqual(0)
    await vi.advanceTimersByTimeAsync(0)
    expect(isMutatingArray[1]).toEqual(1)
    await vi.advanceTimersByTimeAsync(50)
    expect(isMutatingArray[2]).toEqual(0)
    expect(isMutatingArray[isMutatingArray.length - 1]).toEqual(0)
  })

  it('should return the number of fetching mutations when used with useIsMutating (without mutationKey in mutationOptions)', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = new QueryClient()
    const mutationOpts = mutationOptions({
      mutationFn: () => sleep(50).then(() => 'data'),
    })

    function Mutation() {
      const isMutating = useIsMutating()
      const { mutate } = useMutation(() => mutationOpts)

      createRenderEffect(() => {
        isMutatingArray.push(isMutating())
      })

      return (
        <div>
          <button onClick={() => mutate()}>mutate</button>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Mutation />
      </QueryClientProvider>
    ))

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    expect(isMutatingArray[0]).toEqual(0)
    await vi.advanceTimersByTimeAsync(0)
    expect(isMutatingArray[1]).toEqual(1)
    await vi.advanceTimersByTimeAsync(50)
    expect(isMutatingArray[2]).toEqual(0)
    expect(isMutatingArray[isMutatingArray.length - 1]).toEqual(0)
  })

  it('should return the number of fetching mutations when used with useIsMutating', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = new QueryClient()
    const mutationOpts1 = mutationOptions({
      mutationKey: ['key'],
      mutationFn: () => sleep(50).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(50).then(() => 'data2'),
    })

    function Mutation() {
      const isMutating = useIsMutating()
      const { mutate: mutate1 } = useMutation(() => mutationOpts1)
      const { mutate: mutate2 } = useMutation(() => mutationOpts2)

      createRenderEffect(() => {
        isMutatingArray.push(isMutating())
      })

      return (
        <div>
          <button onClick={() => mutate1()}>mutate1</button>
          <button onClick={() => mutate2()}>mutate2</button>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Mutation />
      </QueryClientProvider>
    ))

    fireEvent.click(rendered.getByRole('button', { name: /mutate1/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate2/i }))
    expect(isMutatingArray[0]).toEqual(0)
    await vi.advanceTimersByTimeAsync(0)
    expect(isMutatingArray[2]).toEqual(2)
    await vi.advanceTimersByTimeAsync(50)
    expect(isMutatingArray[isMutatingArray.length - 1]).toEqual(0)
  })

  it('should return the number of fetching mutations when used with useIsMutating (filter mutationOpts1.mutationKey)', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = new QueryClient()
    const mutationOpts1 = mutationOptions({
      mutationKey: ['key'],
      mutationFn: () => sleep(50).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(50).then(() => 'data2'),
    })

    function Mutation() {
      const isMutating = useIsMutating(() => ({
        mutationKey: mutationOpts1.mutationKey,
      }))
      const { mutate: mutate1 } = useMutation(() => mutationOpts1)
      const { mutate: mutate2 } = useMutation(() => mutationOpts2)

      createRenderEffect(() => {
        isMutatingArray.push(isMutating())
      })

      return (
        <div>
          <button onClick={() => mutate1()}>mutate1</button>
          <button onClick={() => mutate2()}>mutate2</button>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Mutation />
      </QueryClientProvider>
    ))

    fireEvent.click(rendered.getByRole('button', { name: /mutate1/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate2/i }))
    expect(isMutatingArray[0]).toEqual(0)
    await vi.advanceTimersByTimeAsync(0)
    expect(isMutatingArray[1]).toEqual(1)
    await vi.advanceTimersByTimeAsync(50)
    expect(isMutatingArray[2]).toEqual(0)
    expect(isMutatingArray[isMutatingArray.length - 1]).toEqual(0)
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating (with mutationKey in mutationOptions)', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = new QueryClient()
    const mutationOpts = mutationOptions({
      mutationKey: ['mutation'],
      mutationFn: () => sleep(500).then(() => 'data'),
    })

    function Mutation() {
      const { mutate } = useMutation(() => mutationOpts)

      return (
        <div>
          <button onClick={() => mutate()}>mutate</button>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Mutation />
      </QueryClientProvider>
    ))

    const mutationCache = queryClient.getMutationCache()
    const unsubscribe = mutationCache.subscribe(() => {
      isMutatingArray.push(queryClient.isMutating(mutationOpts))
    })

    isMutatingArray.push(queryClient.isMutating(mutationOpts))

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    expect(isMutatingArray[0]).toEqual(0)
    await vi.advanceTimersByTimeAsync(0)
    // Use Math.max because subscribe callback count is implementation-dependent
    expect(Math.max(...isMutatingArray)).toEqual(1)
    await vi.advanceTimersByTimeAsync(500)
    expect(isMutatingArray[isMutatingArray.length - 1]).toEqual(0)

    unsubscribe()
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating (without mutationKey in mutationOptions)', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = new QueryClient()
    const mutationOpts = mutationOptions({
      mutationFn: () => sleep(500).then(() => 'data'),
    })

    function Mutation() {
      const { mutate } = useMutation(() => mutationOpts)

      return (
        <div>
          <button onClick={() => mutate()}>mutate</button>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Mutation />
      </QueryClientProvider>
    ))

    const mutationCache = queryClient.getMutationCache()
    const unsubscribe = mutationCache.subscribe(() => {
      isMutatingArray.push(queryClient.isMutating())
    })

    isMutatingArray.push(queryClient.isMutating())

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    expect(isMutatingArray[0]).toEqual(0)
    await vi.advanceTimersByTimeAsync(0)
    // Use Math.max because subscribe callback count is implementation-dependent
    expect(Math.max(...isMutatingArray)).toEqual(1)
    await vi.advanceTimersByTimeAsync(500)
    expect(isMutatingArray[isMutatingArray.length - 1]).toEqual(0)

    unsubscribe()
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = new QueryClient()
    const mutationOpts1 = mutationOptions({
      mutationKey: ['mutation'],
      mutationFn: () => sleep(500).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(500).then(() => 'data2'),
    })

    function Mutation() {
      const { mutate: mutate1 } = useMutation(() => mutationOpts1)
      const { mutate: mutate2 } = useMutation(() => mutationOpts2)

      return (
        <div>
          <button onClick={() => mutate1()}>mutate1</button>
          <button onClick={() => mutate2()}>mutate2</button>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Mutation />
      </QueryClientProvider>
    ))

    const mutationCache = queryClient.getMutationCache()
    const unsubscribe = mutationCache.subscribe(() => {
      isMutatingArray.push(queryClient.isMutating())
    })

    isMutatingArray.push(queryClient.isMutating())

    fireEvent.click(rendered.getByRole('button', { name: /mutate1/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate2/i }))
    expect(isMutatingArray[0]).toEqual(0)
    await vi.advanceTimersByTimeAsync(0)
    // Use Math.max because subscribe callback count is implementation-dependent
    expect(Math.max(...isMutatingArray)).toEqual(2)
    await vi.advanceTimersByTimeAsync(500)
    expect(isMutatingArray[isMutatingArray.length - 1]).toEqual(0)

    unsubscribe()
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating (filter mutationOpt1.mutationKey)', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = new QueryClient()
    const mutationOpts1 = mutationOptions({
      mutationKey: ['mutation'],
      mutationFn: () => sleep(500).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(500).then(() => 'data2'),
    })

    function Mutation() {
      const { mutate: mutate1 } = useMutation(() => mutationOpts1)
      const { mutate: mutate2 } = useMutation(() => mutationOpts2)

      return (
        <div>
          <button onClick={() => mutate1()}>mutate1</button>
          <button onClick={() => mutate2()}>mutate2</button>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Mutation />
      </QueryClientProvider>
    ))

    const mutationCache = queryClient.getMutationCache()
    const unsubscribe = mutationCache.subscribe(() => {
      isMutatingArray.push(
        queryClient.isMutating({
          mutationKey: mutationOpts1.mutationKey,
        }),
      )
    })

    isMutatingArray.push(
      queryClient.isMutating({
        mutationKey: mutationOpts1.mutationKey,
      }),
    )

    fireEvent.click(rendered.getByRole('button', { name: /mutate1/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate2/i }))
    expect(isMutatingArray[0]).toEqual(0)
    await vi.advanceTimersByTimeAsync(0)
    // Use Math.max because subscribe callback count is implementation-dependent
    expect(Math.max(...isMutatingArray)).toEqual(1)
    await vi.advanceTimersByTimeAsync(500)
    expect(isMutatingArray[isMutatingArray.length - 1]).toEqual(0)

    unsubscribe()
  })

  it('should return the number of fetching mutations when used with useMutationState (with mutationKey in mutationOptions)', async () => {
    const mutationStateArray: Array<Array<MutationState>> = []
    const queryClient = new QueryClient()
    const mutationOpts = mutationOptions({
      mutationKey: ['mutation'],
      mutationFn: () => sleep(10).then(() => 'data'),
    })

    function Mutation() {
      const { mutate } = useMutation(() => mutationOpts)
      const states = useMutationState(() => ({
        filters: { mutationKey: mutationOpts.mutationKey, status: 'success' },
      }))

      createEffect(() => {
        mutationStateArray.push(states())
      })

      return (
        <div>
          <button onClick={() => mutate()}>mutate</button>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Mutation />
      </QueryClientProvider>
    ))

    expect(mutationStateArray[0]).toEqual([])

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(10)
    const lastSnapshot = mutationStateArray[mutationStateArray.length - 1]!
    expect(lastSnapshot.length).toEqual(1)
    expect(lastSnapshot[0]?.data).toEqual('data')
  })

  it('should return the number of fetching mutations when used with useMutationState (without mutationKey in mutationOptions)', async () => {
    const mutationStateArray: Array<Array<MutationState>> = []
    const queryClient = new QueryClient()
    const mutationOpts = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data'),
    })

    function Mutation() {
      const { mutate } = useMutation(() => mutationOpts)
      const states = useMutationState(() => ({
        filters: { status: 'success' },
      }))

      createEffect(() => {
        mutationStateArray.push(states())
      })

      return (
        <div>
          <button onClick={() => mutate()}>mutate</button>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Mutation />
      </QueryClientProvider>
    ))

    expect(mutationStateArray[0]).toEqual([])

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(10)
    const lastSnapshot = mutationStateArray[mutationStateArray.length - 1]!
    expect(lastSnapshot.length).toEqual(1)
    expect(lastSnapshot[0]?.data).toEqual('data')
  })

  it('should return the number of fetching mutations when used with useMutationState', async () => {
    const mutationStateArray: Array<Array<MutationState>> = []
    const queryClient = new QueryClient()
    const mutationOpts1 = mutationOptions({
      mutationKey: ['mutation'],
      mutationFn: () => sleep(10).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data2'),
    })

    function Mutation() {
      const { mutate: mutate1 } = useMutation(() => mutationOpts1)
      const { mutate: mutate2 } = useMutation(() => mutationOpts2)
      const states = useMutationState(() => ({
        filters: { status: 'success' },
      }))

      createEffect(() => {
        mutationStateArray.push(states())
      })

      return (
        <div>
          <button onClick={() => mutate1()}>mutate1</button>
          <button onClick={() => mutate2()}>mutate2</button>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Mutation />
      </QueryClientProvider>
    ))

    expect(mutationStateArray[0]).toEqual([])

    fireEvent.click(rendered.getByRole('button', { name: /mutate1/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate2/i }))
    await vi.advanceTimersByTimeAsync(10)
    const lastSnapshot = mutationStateArray[mutationStateArray.length - 1]!
    expect(lastSnapshot.length).toEqual(2)
    expect(lastSnapshot[0]?.data).toEqual('data1')
    expect(lastSnapshot[1]?.data).toEqual('data2')
  })

  it('should return the number of fetching mutations when used with useMutationState (filter mutationOpt1.mutationKey)', async () => {
    const mutationStateArray: Array<Array<MutationState>> = []
    const queryClient = new QueryClient()
    const mutationOpts1 = mutationOptions({
      mutationKey: ['mutation'],
      mutationFn: () => sleep(10).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data2'),
    })

    function Mutation() {
      const { mutate: mutate1 } = useMutation(() => mutationOpts1)
      const { mutate: mutate2 } = useMutation(() => mutationOpts2)
      const states = useMutationState(() => ({
        filters: { mutationKey: mutationOpts1.mutationKey, status: 'success' },
      }))

      createEffect(() => {
        mutationStateArray.push(states())
      })

      return (
        <div>
          <button onClick={() => mutate1()}>mutate1</button>
          <button onClick={() => mutate2()}>mutate2</button>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Mutation />
      </QueryClientProvider>
    ))

    expect(mutationStateArray[0]).toEqual([])

    fireEvent.click(rendered.getByRole('button', { name: /mutate1/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate2/i }))
    await vi.advanceTimersByTimeAsync(10)
    const lastSnapshot = mutationStateArray[mutationStateArray.length - 1]!
    expect(lastSnapshot.length).toEqual(1)
    expect(lastSnapshot[0]?.data).toEqual('data1')
    expect(lastSnapshot[1]).toBeFalsy()
  })
})
