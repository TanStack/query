import { describe, expect, test } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import {
  QueryClient,
  QueryClientProvider,
  useQueries,
} from '@tanstack/react-query'

describe('useQueries combine memoization in React', () => {
  test('stable reference combine should update immediately when queries change', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const stableCombine = (results: any) => results

    const { result, rerender } = renderHook(
      ({ n }: { n: number }) => {
        const queries = useQueries({
          queries: [...Array(n).keys()].map((i) => ({
            queryKey: ['stable', i],
            queryFn: () => Promise.resolve(i + 100),
          })),
          combine: stableCombine,
        })

        return queries
      },
      {
        wrapper,
        initialProps: { n: 0 },
      },
    )

    expect(result.current.length).toBe(0)

    rerender({ n: 1 })
    expect(result.current.length).toBe(1)

    rerender({ n: 2 })
    expect(result.current.length).toBe(2)
  })

  test('inline combine should update immediately when queries change', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result, rerender } = renderHook(
      ({ n }: { n: number }) => {
        const queries = useQueries({
          queries: [...Array(n).keys()].map((i) => ({
            queryKey: ['inline', i],
            queryFn: () => Promise.resolve(i + 100),
          })),
          combine: (results) => results,
        })

        return queries
      },
      {
        wrapper,
        initialProps: { n: 0 },
      },
    )

    expect(result.current.length).toBe(0)

    rerender({ n: 1 })
    expect(result.current.length).toBe(1)

    rerender({ n: 2 })
    expect(result.current.length).toBe(2)
  })
})

describe('useQueries combine memoization edge cases', () => {
  test('should handle dynamic query array changes correctly', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const stableCombine = (results: any) => results

    const { result, rerender } = renderHook(
      ({ ids }: { ids: Array<number> }) => {
        const queries = useQueries({
          queries: ids.map((id) => ({
            queryKey: ['test', id],
            queryFn: () => Promise.resolve(id),
          })),
          combine: stableCombine,
        })
        return queries
      },
      {
        wrapper,
        initialProps: { ids: [] } as { ids: Array<number> },
      },
    )

    expect(result.current.length).toBe(0)

    rerender({ ids: [1, 2, 3] })
    expect(result.current.length).toBe(3)

    rerender({ ids: [2, 3] })
    expect(result.current.length).toBe(2)

    rerender({ ids: [2, 3, 4, 5] })
    expect(result.current.length).toBe(4)

    rerender({ ids: [] })
    expect(result.current.length).toBe(0)
  })

  test('should handle combine function that transforms data', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const transformCombine = (results: any) => ({
      count: results.length,
      data: results,
    })

    const { result, rerender } = renderHook(
      ({ n }: { n: number }) => {
        const queries = useQueries({
          queries: [...Array(n).keys()].map((i) => ({
            queryKey: ['transform', i],
            queryFn: () => Promise.resolve(i),
          })),
          combine: transformCombine,
        })
        return queries
      },
      {
        wrapper,
        initialProps: { n: 0 },
      },
    )

    expect(result.current.count).toBe(0)

    rerender({ n: 2 })
    expect(result.current.count).toBe(2)
    expect(result.current.data.length).toBe(2)

    rerender({ n: 5 })
    expect(result.current.count).toBe(5)
    expect(result.current.data.length).toBe(5)
  })

  test('should not break when switching between stable and inline combine', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const stableCombine = (results: any) => results

    const { result, rerender } = renderHook(
      ({ useStable }: { useStable: boolean }) => {
        const queries = useQueries({
          queries: [
            {
              queryKey: ['switch', 1],
              queryFn: () => Promise.resolve(1),
            },
          ],
          combine: useStable ? stableCombine : (results) => results,
        })
        return queries
      },
      {
        wrapper,
        initialProps: { useStable: true },
      },
    )

    expect(result.current.length).toBe(1)

    rerender({ useStable: false })
    expect(result.current.length).toBe(1)

    rerender({ useStable: true })
    expect(result.current.length).toBe(1)
  })

  test('should handle same length but different queries', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const stableCombine = (results: any) => results

    const { result, rerender } = renderHook(
      ({ keys }: { keys: Array<string> }) => {
        const queries = useQueries({
          queries: keys.map((key) => ({
            queryKey: [key],
            queryFn: () => Promise.resolve(key),
          })),
          combine: stableCombine,
        })
        return queries
      },
      {
        wrapper,
        initialProps: { keys: ['a', 'b'] },
      },
    )

    expect(result.current.length).toBe(2)

    rerender({ keys: ['c', 'd'] })
    expect(result.current.length).toBe(2)

    // Note: Same-length changes may use cached result for one render cycle,
    // but data will be correct after setQueries updates this.#result
    await waitFor(() => {
      expect(result.current[0]?.data).toBe('c')
      expect(result.current[1]?.data).toBe('d')
    })
  })

  test('should handle query order changes with same length', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const stableCombine = (results: any) => results

    const { result, rerender } = renderHook(
      ({ keys }: { keys: Array<string> }) => {
        const queries = useQueries({
          queries: keys.map((key) => ({
            queryKey: [key],
            queryFn: () => Promise.resolve(key),
          })),
          combine: stableCombine,
        })
        return queries
      },
      {
        wrapper,
        initialProps: { keys: ['x', 'y', 'z'] },
      },
    )

    expect(result.current.length).toBe(3)

    rerender({ keys: ['z', 'x', 'y'] })
    expect(result.current.length).toBe(3)

    await waitFor(() => {
      expect(result.current[0]?.data).toBe('z')
      expect(result.current[1]?.data).toBe('x')
      expect(result.current[2]?.data).toBe('y')
    })
  })
})
