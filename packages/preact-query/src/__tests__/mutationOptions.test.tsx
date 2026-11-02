import { QueryClient } from '@tanstack/query-core'
import { createKey, sleep } from '@tanstack/query-test-utils'
import { fireEvent } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useIsMutating, useMutation, useMutationState } from '..'
import { mutationOptions } from '../mutationOptions'
import { renderWithClient } from './utils'
import type { UseMutationOptions } from '../types'

describe('mutationOptions', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return the object received as a parameter without any modification (with mutationKey in mutationOptions)', () => {
    const object: UseMutationOptions = {
      mutationKey: ['key'],
      mutationFn: () => sleep(10).then(() => 5),
    } as const

    expect(mutationOptions(object)).toBe(object)
  })

  it('should return the object received as a parameter without any modification (without mutationKey in mutationOptions)', () => {
    const object: UseMutationOptions = {
      mutationFn: () => sleep(10).then(() => 5),
    } as const

    expect(mutationOptions(object)).toBe(object)
  })

  it('should return the number of fetching mutations when used with useIsMutating (with mutationKey in mutationOptions)', async () => {
    const queryClient = new QueryClient()
    const mutationOpts = mutationOptions({
      mutationKey: createKey(),
      mutationFn: () => sleep(50).then(() => 'data'),
    })

    function IsMutating() {
      const isMutating = useIsMutating()

      return <div>mutating: {isMutating}</div>
    }

    function Mutation() {
      const { mutate } = useMutation(mutationOpts)

      return (
        <div>
          <button onClick={() => mutate()}>mutate</button>
        </div>
      )
    }

    function Page() {
      return (
        <div>
          <IsMutating />
          <Mutation />
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)
    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('mutating: 1')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(51)
    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()
  })

  it('should return the number of fetching mutations when used with useIsMutating (without mutationKey in mutationOptions)', async () => {
    const queryClient = new QueryClient()
    const mutationOpts = mutationOptions({
      mutationFn: () => sleep(50).then(() => 'data'),
    })

    function IsMutating() {
      const isMutating = useIsMutating()

      return <div>mutating: {isMutating}</div>
    }

    function Mutation() {
      const { mutate } = useMutation(mutationOpts)

      return (
        <div>
          <button onClick={() => mutate()}>mutate</button>
        </div>
      )
    }

    function Page() {
      return (
        <div>
          <IsMutating />
          <Mutation />
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)
    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('mutating: 1')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(51)
    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()
  })

  it('should return the number of fetching mutations when used with useIsMutating', async () => {
    const queryClient = new QueryClient()
    const mutationOpts1 = mutationOptions({
      mutationKey: createKey(),
      mutationFn: () => sleep(50).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(50).then(() => 'data2'),
    })

    function IsMutating() {
      const isMutating = useIsMutating()

      return <div>mutating: {isMutating}</div>
    }

    function Mutation() {
      const { mutate: mutate1 } = useMutation(mutationOpts1)
      const { mutate: mutate2 } = useMutation(mutationOpts2)

      return (
        <div>
          <button onClick={() => mutate1()}>mutate1</button>
          <button onClick={() => mutate2()}>mutate2</button>
        </div>
      )
    }

    function Page() {
      return (
        <div>
          <IsMutating />
          <Mutation />
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)
    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate1/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate2/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('mutating: 2')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(51)
    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()
  })

  it('should return the number of fetching mutations when used with useIsMutating (filter mutationOpts1.mutationKey)', async () => {
    const queryClient = new QueryClient()
    const mutationOpts1 = mutationOptions({
      mutationKey: createKey(),
      mutationFn: () => sleep(50).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(50).then(() => 'data2'),
    })

    function IsMutating() {
      const isMutating = useIsMutating({
        mutationKey: mutationOpts1.mutationKey,
      })

      return <div>mutating: {isMutating}</div>
    }

    function Mutation() {
      const { mutate: mutate1 } = useMutation(mutationOpts1)
      const { mutate: mutate2 } = useMutation(mutationOpts2)

      return (
        <div>
          <button onClick={() => mutate1()}>mutate1</button>
          <button onClick={() => mutate2()}>mutate2</button>
        </div>
      )
    }

    function Page() {
      return (
        <div>
          <IsMutating />
          <Mutation />
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)
    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate1/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate2/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('mutating: 1')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(51)
    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating (with mutationKey in mutationOptions)', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = new QueryClient()
    const key = createKey()
    const mutationOpts = mutationOptions({
      mutationKey: key,
      mutationFn: () => sleep(500).then(() => 'data'),
    })

    function Mutation() {
      const isMutating = queryClient.isMutating(mutationOpts)
      const { mutate } = useMutation(mutationOpts)

      isMutatingArray.push(isMutating)

      return (
        <div>
          <button onClick={() => mutate()}>mutate</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Mutation />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    expect(isMutatingArray[0]).toBe(0)
    await vi.advanceTimersByTimeAsync(0)
    expect(isMutatingArray[1]).toBe(1)
    await vi.advanceTimersByTimeAsync(501)
    expect(isMutatingArray[2]).toBe(0)
    expect(isMutatingArray[isMutatingArray.length - 1]).toBe(0)
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating (without mutationKey in mutationOptions)', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = new QueryClient()
    const mutationOpts = mutationOptions({
      mutationFn: () => sleep(500).then(() => 'data'),
    })

    function Mutation() {
      const isMutating = queryClient.isMutating()
      const { mutate } = useMutation(mutationOpts)

      isMutatingArray.push(isMutating)

      return (
        <div>
          <button onClick={() => mutate()}>mutate</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Mutation />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    expect(isMutatingArray[0]).toBe(0)
    await vi.advanceTimersByTimeAsync(0)
    expect(isMutatingArray[1]).toBe(1)
    await vi.advanceTimersByTimeAsync(501)
    expect(isMutatingArray[2]).toBe(0)
    expect(isMutatingArray[isMutatingArray.length - 1]).toBe(0)
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = new QueryClient()
    const key = createKey()
    const mutationOpts1 = mutationOptions({
      mutationKey: key,
      mutationFn: () => sleep(500).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(500).then(() => 'data2'),
    })

    function Mutation() {
      const isMutating = queryClient.isMutating()
      const { mutate: mutate1 } = useMutation(mutationOpts1)
      const { mutate: mutate2 } = useMutation(mutationOpts2)

      isMutatingArray.push(isMutating)

      return (
        <div>
          <button onClick={() => mutate1()}>mutate1</button>
          <button onClick={() => mutate2()}>mutate2</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Mutation />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate1/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate2/i }))
    expect(isMutatingArray[0]).toBe(0)
    await vi.advanceTimersByTimeAsync(0)
    expect(isMutatingArray[1]).toBe(2)
    await vi.advanceTimersByTimeAsync(501)
    expect(isMutatingArray[2]).toBe(0)
    expect(isMutatingArray[isMutatingArray.length - 1]).toBe(0)
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating (filter mutationOpts1.mutationKey)', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = new QueryClient()
    const key = createKey()
    const mutationOpts1 = mutationOptions({
      mutationKey: key,
      mutationFn: () => sleep(500).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(500).then(() => 'data2'),
    })

    function Mutation() {
      const isMutating = queryClient.isMutating({
        mutationKey: mutationOpts1.mutationKey,
      })
      const { mutate: mutate1 } = useMutation(mutationOpts1)
      const { mutate: mutate2 } = useMutation(mutationOpts2)

      isMutatingArray.push(isMutating)

      return (
        <div>
          <button onClick={() => mutate1()}>mutate1</button>
          <button onClick={() => mutate2()}>mutate2</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Mutation />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate1/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate2/i }))
    expect(isMutatingArray[0]).toBe(0)
    await vi.advanceTimersByTimeAsync(0)
    expect(isMutatingArray[1]).toBe(1)
    await vi.advanceTimersByTimeAsync(501)
    expect(isMutatingArray[2]).toBe(0)
    expect(isMutatingArray[isMutatingArray.length - 1]).toBe(0)
  })

  it('should return the number of fetching mutations when used with useMutationState (with mutationKey in mutationOptions)', async () => {
    const queryClient = new QueryClient()
    const mutationOpts = mutationOptions({
      mutationKey: createKey(),
      mutationFn: () => sleep(10).then(() => 'data'),
    })

    function Mutation() {
      const { mutate } = useMutation(mutationOpts)
      const data = useMutationState({
        filters: { mutationKey: mutationOpts.mutationKey, status: 'success' },
      })

      return (
        <div>
          <div>
            results: {JSON.stringify(data.map((mutation) => mutation.data))}
          </div>
          <button onClick={() => mutate()}>mutate</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Mutation />)

    expect(rendered.getByText('results: []')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('results: ["data"]')).toBeInTheDocument()
  })

  it('should return the number of fetching mutations when used with useMutationState (without mutationKey in mutationOptions)', async () => {
    const queryClient = new QueryClient()
    const mutationOpts = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data'),
    })

    function Mutation() {
      const { mutate } = useMutation(mutationOpts)
      const data = useMutationState({
        filters: { status: 'success' },
      })

      return (
        <div>
          <div>
            results: {JSON.stringify(data.map((mutation) => mutation.data))}
          </div>
          <button onClick={() => mutate()}>mutate</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Mutation />)

    expect(rendered.getByText('results: []')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('results: ["data"]')).toBeInTheDocument()
  })

  it('should return the number of fetching mutations when used with useMutationState', async () => {
    const queryClient = new QueryClient()
    const mutationOpts1 = mutationOptions({
      mutationKey: createKey(),
      mutationFn: () => sleep(10).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data2'),
    })

    function Mutation() {
      const { mutate: mutate1 } = useMutation(mutationOpts1)
      const { mutate: mutate2 } = useMutation(mutationOpts2)
      const data = useMutationState({
        filters: { status: 'success' },
      })

      return (
        <div>
          <div>
            results: {JSON.stringify(data.map((mutation) => mutation.data))}
          </div>
          <button onClick={() => mutate1()}>mutate1</button>
          <button onClick={() => mutate2()}>mutate2</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Mutation />)

    expect(rendered.getByText('results: []')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate1/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate2/i }))
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('results: ["data1","data2"]')).toBeInTheDocument()
  })

  it('should return the number of fetching mutations when used with useMutationState (filter mutationOpts1.mutationKey)', async () => {
    const queryClient = new QueryClient()
    const mutationOpts1 = mutationOptions({
      mutationKey: createKey(),
      mutationFn: () => sleep(10).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data2'),
    })

    function Mutation() {
      const { mutate: mutate1 } = useMutation(mutationOpts1)
      const { mutate: mutate2 } = useMutation(mutationOpts2)
      const data = useMutationState({
        filters: { mutationKey: mutationOpts1.mutationKey, status: 'success' },
      })

      return (
        <div>
          <div>
            results: {JSON.stringify(data.map((mutation) => mutation.data))}
          </div>
          <button onClick={() => mutate1()}>mutate1</button>
          <button onClick={() => mutate2()}>mutate2</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Mutation />)

    expect(rendered.getByText('results: []')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate1/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate2/i }))
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('results: ["data1"]')).toBeInTheDocument()
  })
})
