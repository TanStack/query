import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Loading, Show, createEffect, createSignal } from 'solid-js'
import { createKey, sleep } from '@tanstack/query-test-utils'
import { QueryClient, useQuery } from '..'
import { renderWithClient } from './utils'
import type { UseQueryResult } from '..'

describe('observer cache events in useBaseQuery', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
      },
    })
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('does not re-run select or downstream effects on observerAdded, observerOptionsUpdated, observerResultsUpdated, or observerRemoved', async () => {
    const key = createKey()
    let selectCalls = 0
    let effectRuns = 0
    const [showSibling, setShowSibling] = createSignal(false)
    const [siblingFocusRefetch, setSiblingFocusRefetch] = createSignal(true)
    let primary!: UseQueryResult<{ doubled: number }, Error>

    function Sibling() {
      useQuery(
        () => ({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 1),
          staleTime: 20,
          refetchOnWindowFocus: siblingFocusRefetch(),
        }),
        () => queryClient,
      )
      return <span>sibling</span>
    }

    function Page() {
      primary = useQuery(
        () => ({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 1),
          select: (n: number) => {
            selectCalls += 1
            return { doubled: n * 2 }
          },
        }),
        () => queryClient,
      )

      createEffect(
        () => primary.data.doubled,
        () => {
          effectRuns += 1
        },
      )

      return (
        <div>
          <Loading fallback={<span>loading</span>}>
            <span>{primary.data.doubled}</span>
          </Loading>
          <Show when={showSibling()}>
            <Sibling />
          </Show>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)
    expect(rendered.getByText('loading')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(15)
    expect(rendered.getByText('2')).toBeInTheDocument()

    const settledSelectCalls = selectCalls
    const settledEffectRuns = effectRuns

    // Mount sibling observer -> fires `observerAdded` and `observerResultsUpdated`.
    setShowSibling(true)
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('sibling')).toBeInTheDocument()

    // Mutate sibling observer options -> fires `observerOptionsUpdated` and `observerResultsUpdated`.
    setSiblingFocusRefetch(false)
    await vi.advanceTimersByTimeAsync(0)

    // Advance past sibling's staleTime (20ms) -> sibling's stale timer fires `observerResultsUpdated`.
    await vi.advanceTimersByTimeAsync(30)

    // Unmount sibling observer -> fires `observerRemoved`.
    setShowSibling(false)
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.queryByText('sibling')).not.toBeInTheDocument()

    expect(selectCalls).toBe(settledSelectCalls)
    expect(effectRuns).toBe(settledEffectRuns)

    // Real cache mutation (`updated`) still propagates.
    queryClient.setQueryData(key, 5)
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('10')).toBeInTheDocument()
    expect(selectCalls).toBeGreaterThan(settledSelectCalls)
    expect(effectRuns).toBe(settledEffectRuns + 1)
  })

  it('mounts a child observer gated under <Show> reading q.data only once', async () => {
    const key = createKey()
    let mounts = 0
    const options = () => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 1),
    })

    function Child() {
      mounts += 1
      if (mounts > 20) {
        throw new Error('remount loop')
      }
      useQuery(options, () => queryClient)
      return <span>child</span>
    }

    function Page() {
      const q = useQuery(options, () => queryClient)
      return (
        <Loading fallback={<span>loading</span>}>
          <Show when={q.data > 0}>
            <Child />
          </Show>
        </Loading>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)
    expect(rendered.getByText('loading')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(50)
    expect(rendered.getByText('child')).toBeInTheDocument()
    expect(mounts).toBe(1)
  })
})
