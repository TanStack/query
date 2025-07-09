import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { sleep } from '@tanstack/query-test-utils'
import { fireEvent } from '@testing-library/react'
import { mutationOptions } from '../mutationOptions'
import { useIsMutating, useMutation, useMutationState } from '..'
import { renderWithClient } from './utils'
import type { MutationState } from '@tanstack/query-core'

describe('mutationOptions', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return the object received as a parameter without any modification.', () => {
    const object = {
      mutationKey: ['key'],
      mutationFn: () => Promise.resolve(5),
    } as const

    expect(mutationOptions(object)).toStrictEqual(object)
  })

  it('should return the number of fetching mutations when used with useIsMutating', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = new QueryClient()

    function IsMutating() {
      const isMutating = useIsMutating()
      isMutatingArray.push(isMutating)
      return null
    }

    const mutationOpts = mutationOptions({
      mutationKey: ['key'],
      mutationFn: () => sleep(50).then(() => 'data'),
    })

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
    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))

    expect(isMutatingArray[0]).toEqual(0)
    await vi.advanceTimersByTimeAsync(0)
    expect(isMutatingArray[1]).toEqual(1)
    await vi.advanceTimersByTimeAsync(51)
    expect(isMutatingArray[2]).toEqual(0)
    expect(isMutatingArray[isMutatingArray.length - 1]).toEqual(0)
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = new QueryClient()

    const mutationOpts = mutationOptions({
      mutationKey: ['mutation'],
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

    expect(isMutatingArray[0]).toEqual(0)
    await vi.advanceTimersByTimeAsync(0)
    expect(isMutatingArray[1]).toEqual(1)
    await vi.advanceTimersByTimeAsync(501)
    expect(isMutatingArray[2]).toEqual(0)
    expect(isMutatingArray[isMutatingArray.length - 1]).toEqual(0)
  })

  it('should return the number of fetching mutations when used with useMutationState', async () => {
    const mutationStateArray: Array<
      MutationState<unknown, Error, unknown, unknown>
    > = []
    const queryClient = new QueryClient()

    const mutationOpts = mutationOptions({
      mutationKey: ['mutation'],
      mutationFn: () => Promise.resolve('data'),
    })

    function Mutation() {
      const { mutate } = useMutation(mutationOpts)
      const data = useMutationState({
        filters: { ...mutationOpts, status: 'success' },
      })
      mutationStateArray.push(...data)

      return (
        <div>
          <button onClick={() => mutate()}>mutate</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Mutation />)
    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))

    await vi.advanceTimersByTimeAsync(0)
    expect(mutationStateArray.length).toEqual(1)
    expect(mutationStateArray[0]?.data).toEqual('data')
  })
})
