import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/svelte'
import { QueryClient } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { mutationOptions } from '../../src/index.js'
import Base from './Base.svelte'
import Multi from './Multi.svelte'

describe('mutationOptions', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should return the object received as a parameter without any modification (with mutationKey in mutationOptions)', () => {
    const object = {
      mutationKey: ['key'],
      mutationFn: () => sleep(10).then(() => 5),
    } as const

    expect(mutationOptions(object)).toBe(object)
  })

  it('should return the object received as a parameter without any modification (without mutationKey in mutationOptions)', () => {
    const object = {
      mutationFn: () => sleep(10).then(() => 5),
    } as const

    expect(mutationOptions(object)).toBe(object)
  })

  it('should return the number of fetching mutations when used with useIsMutating (with mutationKey in mutationOptions)', async () => {
    const key = queryKey()
    const mutationOpts = mutationOptions({
      mutationKey: key,
      mutationFn: () => sleep(50).then(() => 'data'),
    })

    const rendered = render(Base, {
      props: { queryClient, mutationOpts: () => mutationOpts },
    })

    expect(rendered.getByText('isMutating: 0')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('isMutating: 1')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(51)
    expect(rendered.getByText('isMutating: 0')).toBeInTheDocument()
  })

  it('should return the number of fetching mutations when used with useIsMutating (without mutationKey in mutationOptions)', async () => {
    const mutationOpts = mutationOptions({
      mutationFn: () => sleep(50).then(() => 'data'),
    })

    const rendered = render(Base, {
      props: { queryClient, mutationOpts: () => mutationOpts },
    })

    expect(rendered.getByText('isMutating: 0')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('isMutating: 1')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(51)
    expect(rendered.getByText('isMutating: 0')).toBeInTheDocument()
  })

  it('should return the number of fetching mutations when used with useIsMutating', async () => {
    const key = queryKey()
    const mutationOpts1 = mutationOptions({
      mutationKey: key,
      mutationFn: () => sleep(50).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(50).then(() => 'data2'),
    })

    const rendered = render(Multi, {
      props: {
        queryClient,
        mutationOpts1: () => mutationOpts1,
        mutationOpts2: () => mutationOpts2,
      },
    })

    expect(rendered.getByText('isMutating: 0')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate1/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate2/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('isMutating: 2')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(51)
    expect(rendered.getByText('isMutating: 0')).toBeInTheDocument()
  })

  it('should return the number of fetching mutations when used with useIsMutating (filter mutationOpts1.mutationKey)', async () => {
    const key = queryKey()
    const mutationOpts1 = mutationOptions({
      mutationKey: key,
      mutationFn: () => sleep(50).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(50).then(() => 'data2'),
    })

    const rendered = render(Multi, {
      props: {
        queryClient,
        mutationOpts1: () => mutationOpts1,
        mutationOpts2: () => mutationOpts2,
        isMutatingFilters: { mutationKey: mutationOpts1.mutationKey },
      },
    })

    expect(rendered.getByText('isMutating: 0')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate1/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate2/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('isMutating: 1')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(51)
    expect(rendered.getByText('isMutating: 0')).toBeInTheDocument()
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating (with mutationKey in mutationOptions)', async () => {
    const key = queryKey()
    const mutationOpts = mutationOptions({
      mutationKey: key,
      mutationFn: () => sleep(500).then(() => 'data'),
    })

    const rendered = render(Base, {
      props: {
        queryClient,
        mutationOpts: () => mutationOpts,
        isMutatingFilters: { mutationKey: mutationOpts.mutationKey },
      },
    })

    expect(rendered.getByText('clientIsMutating: 0')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('clientIsMutating: 1')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(501)
    expect(rendered.getByText('clientIsMutating: 0')).toBeInTheDocument()
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating (without mutationKey in mutationOptions)', async () => {
    const mutationOpts = mutationOptions({
      mutationFn: () => sleep(500).then(() => 'data'),
    })

    const rendered = render(Base, {
      props: { queryClient, mutationOpts: () => mutationOpts },
    })

    expect(rendered.getByText('clientIsMutating: 0')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('clientIsMutating: 1')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(501)
    expect(rendered.getByText('clientIsMutating: 0')).toBeInTheDocument()
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating', async () => {
    const key = queryKey()
    const mutationOpts1 = mutationOptions({
      mutationKey: key,
      mutationFn: () => sleep(500).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(500).then(() => 'data2'),
    })

    const rendered = render(Multi, {
      props: {
        queryClient,
        mutationOpts1: () => mutationOpts1,
        mutationOpts2: () => mutationOpts2,
      },
    })

    expect(rendered.getByText('clientIsMutating: 0')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate1/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate2/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('clientIsMutating: 2')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(501)
    expect(rendered.getByText('clientIsMutating: 0')).toBeInTheDocument()
  })

  it('should return the number of fetching mutations when used with queryClient.isMutating (filter mutationOpts1.mutationKey)', async () => {
    const key = queryKey()
    const mutationOpts1 = mutationOptions({
      mutationKey: key,
      mutationFn: () => sleep(500).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(500).then(() => 'data2'),
    })

    const rendered = render(Multi, {
      props: {
        queryClient,
        mutationOpts1: () => mutationOpts1,
        mutationOpts2: () => mutationOpts2,
        isMutatingFilters: { mutationKey: mutationOpts1.mutationKey },
      },
    })

    expect(rendered.getByText('clientIsMutating: 0')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate1/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate2/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('clientIsMutating: 1')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(501)
    expect(rendered.getByText('clientIsMutating: 0')).toBeInTheDocument()
  })

  it('should return mutation states when used with useMutationState (with mutationKey in mutationOptions)', async () => {
    const key = queryKey()
    const mutationOpts = mutationOptions({
      mutationKey: key,
      mutationFn: () => sleep(10).then(() => 'data'),
    })

    const rendered = render(Base, {
      props: {
        queryClient,
        mutationOpts: () => mutationOpts,
        mutationStateOpts: {
          filters: {
            mutationKey: mutationOpts.mutationKey,
            status: 'success',
          },
        },
      },
    })

    expect(rendered.getByText('mutationState: []')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('mutationState: ["data"]')).toBeInTheDocument()
  })

  it('should return mutation states when used with useMutationState (without mutationKey in mutationOptions)', async () => {
    const mutationOpts = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data'),
    })

    const rendered = render(Base, {
      props: {
        queryClient,
        mutationOpts: () => mutationOpts,
        mutationStateOpts: {
          filters: { status: 'success' },
        },
      },
    })

    expect(rendered.getByText('mutationState: []')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('mutationState: ["data"]')).toBeInTheDocument()
  })

  it('should return mutation states when used with useMutationState', async () => {
    const key = queryKey()
    const mutationOpts1 = mutationOptions({
      mutationKey: key,
      mutationFn: () => sleep(10).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data2'),
    })

    const rendered = render(Multi, {
      props: {
        queryClient,
        mutationOpts1: () => mutationOpts1,
        mutationOpts2: () => mutationOpts2,
        mutationStateOpts: {
          filters: { status: 'success' },
        },
      },
    })

    expect(rendered.getByText('mutationState: []')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate1/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate2/i }))
    await vi.advanceTimersByTimeAsync(11)
    expect(
      rendered.getByText('mutationState: ["data1","data2"]'),
    ).toBeInTheDocument()
  })

  it('should return mutation states when used with useMutationState (filter mutationOpts1.mutationKey)', async () => {
    const key = queryKey()
    const mutationOpts1 = mutationOptions({
      mutationKey: key,
      mutationFn: () => sleep(10).then(() => 'data1'),
    })
    const mutationOpts2 = mutationOptions({
      mutationFn: () => sleep(10).then(() => 'data2'),
    })

    const rendered = render(Multi, {
      props: {
        queryClient,
        mutationOpts1: () => mutationOpts1,
        mutationOpts2: () => mutationOpts2,
        mutationStateOpts: {
          filters: {
            mutationKey: mutationOpts1.mutationKey,
            status: 'success',
          },
        },
      },
    })

    expect(rendered.getByText('mutationState: []')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate1/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate2/i }))
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('mutationState: ["data1"]')).toBeInTheDocument()
  })
})
