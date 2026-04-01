import * as React from 'react'
import { QueryClient } from '@tanstack/query-core'
import { fireEvent, waitFor } from '@testing-library/react'
import { mutationOptions } from '../mutationOptions'
import { useIsMutating, useMutation } from '..'
import { renderWithClient, sleep } from './utils'
import type { UseMutationOptions } from '../types'

describe('mutationOptions', () => {
  it('should return the object received as a parameter without any modification (with mutationKey)', () => {
    const object: UseMutationOptions = {
      mutationKey: ['key'],
      mutationFn: () => Promise.resolve(5),
    } as const

    expect(mutationOptions(object)).toBe(object)
  })

  it('should return the object received as a parameter without any modification (without mutationKey)', () => {
    const object: UseMutationOptions = {
      mutationFn: () => Promise.resolve(5),
    } as const

    expect(mutationOptions(object)).toBe(object)
  })

  it('should work with useMutation (with mutationKey)', async () => {
    const queryClient = new QueryClient()
    const mutationOpts = mutationOptions({
      mutationKey: ['key'],
      mutationFn: () => sleep(10).then(() => 'data'),
    })

    function Page() {
      const mutation = useMutation(mutationOpts)

      return (
        <div>
          <button onClick={() => mutation.mutate()}>mutate</button>
          <span>{mutation.data ?? 'empty'}</span>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    expect(rendered.getByText('empty')).toBeTruthy()
    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await waitFor(() => rendered.getByText('data'))
  })

  it('should work with useMutation (without mutationKey)', async () => {
    const queryClient = new QueryClient()
    const mutationOpts = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data'),
    })

    function Page() {
      const mutation = useMutation(mutationOpts)

      return (
        <div>
          <button onClick={() => mutation.mutate()}>mutate</button>
          <span>{mutation.data ?? 'empty'}</span>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    expect(rendered.getByText('empty')).toBeTruthy()
    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await waitFor(() => rendered.getByText('data'))
  })

  it('should work with useIsMutating filtering by mutationKey', async () => {
    const queryClient = new QueryClient()
    const mutationOpts1 = mutationOptions({
      mutationKey: ['key1'],
      mutationFn: () => sleep(50).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationKey: ['key2'],
      mutationFn: () => sleep(50).then(() => 'data2'),
    })

    function Page() {
      const isMutating = useIsMutating({
        mutationKey: mutationOpts1.mutationKey,
      })
      const { mutate: mutate1 } = useMutation(mutationOpts1)
      const { mutate: mutate2 } = useMutation(mutationOpts2)

      return (
        <div>
          <span>isMutating: {isMutating}</span>
          <button onClick={() => mutate1()}>mutate1</button>
          <button onClick={() => mutate2()}>mutate2</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    rendered.getByText('isMutating: 0')
    fireEvent.click(rendered.getByRole('button', { name: /mutate1/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate2/i }))
    await waitFor(() => rendered.getByText('isMutating: 1'))
    await waitFor(() => rendered.getByText('isMutating: 0'))
  })

  it('should work with queryClient.isMutating', async () => {
    const queryClient = new QueryClient()
    const mutationOpts = mutationOptions({
      mutationKey: ['mutation'],
      mutationFn: () => sleep(10).then(() => 'data'),
    })

    function Page() {
      const isMutating = queryClient.isMutating({
        mutationKey: mutationOpts.mutationKey,
      })
      const { mutate } = useMutation(mutationOpts)

      return (
        <div>
          <span>isMutating: {isMutating}</span>
          <button onClick={() => mutate()}>mutate</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    rendered.getByText('isMutating: 0')
    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await waitFor(() => rendered.getByText('isMutating: 1'))
    await waitFor(() => rendered.getByText('isMutating: 0'))
  })
})
