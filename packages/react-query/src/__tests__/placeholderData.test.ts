import { createKey, sleep } from '@tanstack/query-test-utils'
import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, useQueries, useQuery } from '..'

class Placeholder {
  constructor(readonly value: number) {}
}

type Options = {
  queryKey: ReadonlyArray<unknown>
  queryFn: () => Promise<Placeholder>
  placeholderData: Placeholder
  select?: (data: Placeholder) => Placeholder | Set<number>
}

function useMultiple(options: Options, client: QueryClient) {
  return useQueries({ queries: [options] }, client)[0]
}

const stable = { value: 1 }
const selectSet = (data: Placeholder) => new Set([data.value])
const selectError = () => {
  throw new Error('selection failed')
}

describe('placeholder updates', () => {
  let client: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    client = new QueryClient()
  })

  afterEach(() => {
    client.clear()
    vi.useRealTimers()
  })

  it.each([
    [
      'useQueries with a class',
      useMultiple,
      () => new Placeholder(1),
      undefined,
    ],
    [
      'useQueries with a changing object',
      useMultiple,
      (value: number) => ({ value }),
      undefined,
    ],
    [
      'useQueries with a Set selector',
      useMultiple,
      () => ({ value: 1 }),
      selectSet,
    ],
    ['useQuery with a Set selector', useQuery, () => ({ value: 1 }), selectSet],
    [
      'useQueries with a throwing selector',
      useMultiple,
      () => stable,
      selectError,
    ],
    ['useQuery with a throwing selector', useQuery, () => stable, selectError],
  ] as const)(
    '%s settles after a parent render',
    async (_name, useResult, placeholder, select) => {
      const key = createKey()
      let renders = 0
      const { result, rerender } = renderHook(() => {
        if (++renders > 10) {
          throw new Error('Repeated renders for an unresolved query')
        }
        const input = placeholder(renders)
        const { data, error } = useResult(
          {
            queryKey: key,
            queryFn: () => new Promise<Placeholder>(() => {}),
            placeholderData: input,
            select,
          },
          client,
        )
        return { data, error, input }
      })
      rerender()
      await vi.advanceTimersByTimeAsync(50)
      const { data, error, input } = result.current
      const expected =
        select === selectError
          ? 'selection failed'
          : select
            ? new Set([input.value])
            : input
      expect(error?.message ?? data).toStrictEqual(expected)
    },
  )

  it('shows fetched data after the selection of a computed placeholder throws', async () => {
    const queryKey = createKey()
    const placeholderData = () => ({ value: 0 })
    const select = ({ value }: { value: number }) => {
      if (value === 0) throw new Error('selection failed')
      return value
    }
    const queryFn = () => sleep(10).then(() => ({ value: 1 }))
    const { result, rerender } = renderHook(() => {
      const [{ data, error }] = useQueries(
        { queries: [{ queryKey, queryFn, placeholderData, select }] },
        client,
      )
      return { data, error }
    })

    rerender()
    await vi.advanceTimersByTimeAsync(1)
    expect(result.current.error?.message).toBe('selection failed')

    await vi.advanceTimersByTimeAsync(20)
    expect(result.current).toStrictEqual({ data: 1, error: null })
  })
})
