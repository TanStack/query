/* eslint-disable @typescript-eslint/require-await */
import {
  createRenderStream,
  useTrackRenders,
} from '@testing-library/react-render-stream'
import { act, render, screen } from '@testing-library/react'
import * as React from 'react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { QueryClientProvider, useQuery } from '..'
import { QueryCache } from '../index'
import { createQueryClient, queryKey, sleep } from './utils'

describe('react transitions', () => {
  const queryCache = new QueryCache()
  const queryClient = createQueryClient({
    queryCache,
  })

  beforeAll(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    global.IS_REACT_ACT_ENVIRONMENT = true
    queryClient.setDefaultOptions({
      queries: { experimental_prefetchInRender: true },
    })
  })
  afterAll(() => {
    queryClient.setDefaultOptions({
      queries: { experimental_prefetchInRender: false },
    })
  })

  it.only('should keep values of old key around with startTransition', async () => {
    vi.useFakeTimers()
    const key = queryKey()

    function Loading() {
      return <>loading...</>
    }

    function Page() {
      const [isPending, startTransition] = React.useTransition()
      const [count, setCount] = React.useState(0)
      const query = useQuery({
        queryKey: [key, count],
        queryFn: async () => {
          await sleep(10)
          return 'test' + count
        },
        staleTime: 1000,
      })

      const data = React.use(query.promise)

      return (
        <div>
          <button onClick={() => startTransition(() => setCount((c) => c + 1))}>
            increment
          </button>
          <div>data: {data}</div>
          {isPending && <span>pending...</span>}
        </div>
      )
    }
    // Initial render should show fallback
    await act(async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <React.Suspense fallback={<Loading />}>
            <Page />
          </React.Suspense>
        </QueryClientProvider>,
      )
    })

    screen.getByText('loading...')
    expect(screen.queryByText('button')).toBeNull()
    expect(screen.queryByText('pending...')).toBeNull()
    expect(screen.queryByText('data: test0')).toBeNull()

    // Resolve the query, should show the data
    await act(async () => {
      vi.runAllTimers()
    })

    expect(screen.queryByText('loading...')).toBeNull()
    screen.getByRole('button')
    expect(screen.queryByText('pending...')).toBeNull()
    screen.getByText('data: test0')

    // Update in a transition, should show pending state, and existing content
    await act(async () => {
      screen.getByRole('button', { name: 'increment' }).click()
    })
    expect(screen.queryByText('loading...')).toBeNull()
    screen.getByRole('button')
    screen.getByText('pending...')
    screen.getByText('data: test0')

    // Resolve the query, should show the new data and no pending state
    await act(async () => {
      vi.runAllTimers()
    })
    expect(screen.queryByText('loading...')).toBeNull()
    screen.getByRole('button')
    expect(screen.queryByText('pending...')).toBeNull()
    screen.getByText('data: test1')
  })

  function createDeferred<T>() {
    let resolve: (value: T) => void
    let reject: (reason: unknown) => void
    const promise = new Promise((_resolve, _reject) => {
      resolve = _resolve
      reject = _reject
    })
    return { promise, resolve: resolve!, reject: reject! }
  }

  it('should handle parallel queries with shared parent key in transition', async () => {
    const renderStream = createRenderStream({ snapshotDOM: true })

    let deferredA = createDeferred<void>()
    let deferredB = createDeferred<void>()

    function ComponentA(props: { parentId: number }) {
      const query = useQuery({
        queryKey: ['A', props.parentId],
        queryFn: async () => {
          await deferredA.promise
          deferredA = createDeferred()
          return `A-${props.parentId}`
        },
        staleTime: 1000,
      })

      const data = React.use(query.promise)
      return <div>A data: {data}</div>
    }

    function ComponentALoading() {
      return <div>A loading..</div>
    }

    function ComponentB(props: { parentId: number }) {
      const query = useQuery({
        queryKey: ['B', props.parentId],
        queryFn: async () => {
          await deferredB.promise
          deferredB = createDeferred()
          return `B-${props.parentId}`
        },
        staleTime: 1000,
      })

      const data = React.use(query.promise)
      return <div>B data: {data}</div>
    }

    function ComponentBLoading() {
      return <div>B loading..</div>
    }

    function Parent() {
      const [count, setCount] = React.useState(0)
      return (
        <div>
          <button
            onClick={() => React.startTransition(() => setCount((c) => c + 1))}
          >
            increment
          </button>
          <React.Suspense fallback={<ComponentALoading />}>
            <ComponentA parentId={count} />
          </React.Suspense>
          <React.Suspense fallback={<ComponentBLoading />}>
            <ComponentB parentId={count} />
          </React.Suspense>
        </div>
      )
    }

    const rendered = await renderStream.render(
      <QueryClientProvider client={queryClient}>
        <Parent />
      </QueryClientProvider>,
    )

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('A loading..')
      withinDOM().getByText('B loading..')
      expect(renderedComponents).toEqual([
        Parent,
        ComponentBLoading,
        ComponentALoading,
      ])
    }

    await act(async () => {
      deferredA.resolve()
      deferredB.resolve()
    })

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('A data: A-0')
      withinDOM().getByText('B data: B-0')
      expect(renderedComponents).toEqual([ComponentB, ComponentA])
    }

    await act(async () => {
      rendered.getByRole('button', { name: 'increment' }).click()
    })

    await act(async () => {
      deferredA.resolve()
      deferredB.resolve()
    })

    {
      // first render
      const firstRender = await renderStream.takeRender()
      firstRender.withinDOM().getByText('A data: A-0')
      firstRender.withinDOM().getByText('B data: B-0')

      // second render
      const secondRender = await renderStream.takeRender()
      secondRender.withinDOM().getByText('A data: A-1')
      secondRender.withinDOM().getByText('B data: B-0')

      // third render
      const thirdRender = await renderStream.takeRender()
      thirdRender.withinDOM().getByText('A data: A-1')
      thirdRender.withinDOM().getByText('B data: B-1')
    }
  })
})
