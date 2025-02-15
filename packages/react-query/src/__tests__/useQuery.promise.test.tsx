import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import {
  createRenderStream,
  useTrackRenders,
} from '@testing-library/react-render-stream'
import {
  QueryClientProvider,
  QueryErrorResetBoundary,
  keepPreviousData,
  useQuery,
} from '..'
import { QueryCache } from '../index'
import { createQueryClient, queryKey, sleep } from './utils'

describe('useQuery().promise', () => {
  const queryCache = new QueryCache()
  const queryClient = createQueryClient({
    queryCache,
  })

  beforeAll(() => {
    queryClient.setDefaultOptions({
      queries: { experimental_prefetchInRender: true },
    })
  })
  afterAll(() => {
    queryClient.setDefaultOptions({
      queries: { experimental_prefetchInRender: false },
    })
  })

  it('should work with a basic test', async () => {
    const key = queryKey()

    const renderStream = createRenderStream({ snapshotDOM: true })

    function MyComponent(props: { promise: Promise<string> }) {
      const data = React.use(props.promise)
      useTrackRenders()
      return <>{data}</>
    }

    function Loading() {
      useTrackRenders()
      return <>loading..</>
    }

    function Page() {
      useTrackRenders()
      const query = useQuery({
        queryKey: key,
        queryFn: async () => {
          await sleep(1)
          return 'test'
        },
      })

      return (
        <React.Suspense fallback={<Loading />}>
          <MyComponent promise={query.promise} />
        </React.Suspense>
      )
    }

    await renderStream.render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('loading..')
      expect(renderedComponents).toEqual([Page, Loading])
    }

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('test')
      expect(renderedComponents).toEqual([Page, MyComponent])
    }
  })

  it('colocate suspense and promise', async () => {
    const key = queryKey()
    let callCount = 0

    const renderStream = createRenderStream({ snapshotDOM: true })

    function MyComponent() {
      useTrackRenders()
      const query = useQuery({
        queryKey: key,
        queryFn: async () => {
          callCount++
          await sleep(1)
          return 'test'
        },
        staleTime: 1000,
      })
      const data = React.use(query.promise)

      return <>{data}</>
    }

    function Loading() {
      useTrackRenders()
      return <>loading..</>
    }
    function Page() {
      useTrackRenders()
      return (
        <React.Suspense fallback={<Loading />}>
          <MyComponent />
        </React.Suspense>
      )
    }

    await renderStream.render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('loading..')
      expect(renderedComponents).toEqual([Page, Loading])
    }
    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('test')
      expect(renderedComponents).toEqual([MyComponent])
    }

    expect(callCount).toBe(1)
  })

  it('parallel queries', async () => {
    const key = queryKey()
    const renderStream = createRenderStream({ snapshotDOM: true })
    let callCount = 0

    function MyComponent() {
      useTrackRenders()
      const query = useQuery({
        queryKey: key,
        queryFn: async () => {
          callCount++
          await sleep(1)
          return 'test'
        },
        staleTime: 1000,
      })
      const data = React.use(query.promise)

      return <>{data}</>
    }

    function Loading() {
      useTrackRenders()
      return <>loading..</>
    }
    function Page() {
      useTrackRenders()
      return (
        <>
          <React.Suspense fallback={<Loading />}>
            <MyComponent />
            <MyComponent />
            <MyComponent />
          </React.Suspense>
          <React.Suspense fallback={null}>
            <MyComponent />
            <MyComponent />
          </React.Suspense>
        </>
      )
    }

    await renderStream.render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('loading..')
      expect(renderedComponents).toEqual([Page, Loading])
    }

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('testtesttesttesttest')
      expect(renderedComponents).toEqual([
        MyComponent,
        MyComponent,
        MyComponent,
        MyComponent,
        MyComponent,
      ])
    }

    expect(callCount).toBe(1)
  })

  it('should work with initial data', async () => {
    const key = queryKey()
    const renderStream = createRenderStream({ snapshotDOM: true })

    function MyComponent(props: { promise: Promise<string> }) {
      useTrackRenders()
      const data = React.use(props.promise)

      return <>{data}</>
    }
    function Loading() {
      useTrackRenders()

      return <>loading..</>
    }
    function Page() {
      useTrackRenders()
      const query = useQuery({
        queryKey: key,
        queryFn: async () => {
          await sleep(1)
          return 'test'
        },
        initialData: 'initial',
      })

      return (
        <React.Suspense fallback={<Loading />}>
          <MyComponent promise={query.promise} />
        </React.Suspense>
      )
    }

    await renderStream.render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('initial')
      expect(renderedComponents).toEqual([Page, MyComponent])
    }

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('test')
      expect(renderedComponents).toEqual([Page, MyComponent])
    }
  })

  it('should not fetch with initial data and staleTime', async () => {
    const key = queryKey()
    const renderStream = createRenderStream({ snapshotDOM: true })
    const queryFn = vi.fn().mockImplementation(async () => {
      await sleep(1)
      return 'test'
    })

    function MyComponent(props: { promise: Promise<string> }) {
      useTrackRenders()
      const data = React.use(props.promise)

      return <>{data}</>
    }
    function Loading() {
      useTrackRenders()
      return <>loading..</>
    }
    function Page() {
      useTrackRenders()
      const query = useQuery({
        queryKey: key,
        queryFn,
        initialData: 'initial',
        staleTime: 1000,
      })

      return (
        <React.Suspense fallback={<Loading />}>
          <MyComponent promise={query.promise} />
        </React.Suspense>
      )
    }

    await renderStream.render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('initial')
      expect(renderedComponents).toEqual([Page, MyComponent])
    }

    // should not call queryFn because of staleTime + initialData combo
    expect(queryFn).toHaveBeenCalledTimes(0)
  })

  it('should work with static placeholderData', async () => {
    const key = queryKey()
    const renderStream = createRenderStream({ snapshotDOM: true })

    function MyComponent(props: { promise: Promise<string> }) {
      useTrackRenders()
      const data = React.use(props.promise)

      return <>{data}</>
    }
    function Loading() {
      useTrackRenders()

      return <>loading..</>
    }
    function Page() {
      const query = useQuery({
        queryKey: key,
        queryFn: async () => {
          await sleep(1)
          return 'test'
        },
        placeholderData: 'placeholder',
      })
      useTrackRenders()

      return (
        <React.Suspense fallback={<Loading />}>
          <MyComponent promise={query.promise} />
        </React.Suspense>
      )
    }

    await renderStream.render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('placeholder')
      expect(renderedComponents).toEqual([Page, MyComponent])
    }
    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('test')
      expect(renderedComponents).toEqual([Page, MyComponent])
    }
  })

  it('should work with placeholderData: keepPreviousData', async () => {
    const key = queryKey()
    const renderStream = createRenderStream({ snapshotDOM: true })

    function MyComponent(props: { promise: Promise<string> }) {
      useTrackRenders()
      const data = React.use(props.promise)

      return <>{data}</>
    }
    function Loading() {
      useTrackRenders()

      return <>loading..</>
    }
    function Page() {
      useTrackRenders()
      const [count, setCount] = React.useState(0)
      const query = useQuery({
        queryKey: [...key, count],
        queryFn: async () => {
          await sleep(1)
          return 'test-' + count
        },
        placeholderData: keepPreviousData,
      })

      return (
        <div>
          <React.Suspense fallback={<Loading />}>
            <MyComponent promise={query.promise} />
          </React.Suspense>
          <button onClick={() => setCount((c) => c + 1)}>increment</button>
        </div>
      )
    }

    const rendered = await renderStream.render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('loading..')
      expect(renderedComponents).toEqual([Page, Loading])
    }
    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('test-0')
      expect(renderedComponents).toEqual([MyComponent])
    }

    rendered.getByRole('button', { name: 'increment' }).click()

    // re-render because of the increment
    {
      const { renderedComponents } = await renderStream.takeRender()
      expect(renderedComponents).toEqual([Page, MyComponent])
    }

    // re-render with new data, no loading between
    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('test-1')
      // no more suspense boundary rendering
      expect(renderedComponents).toEqual([Page, MyComponent])
    }
  })

  it('should be possible to select a part of the data with select', async () => {
    const key = queryKey()
    const renderStream = createRenderStream({ snapshotDOM: true })

    function MyComponent(props: { promise: Promise<string> }) {
      useTrackRenders()
      const data = React.use(props.promise)
      return <>{data}</>
    }

    function Loading() {
      useTrackRenders()
      return <>loading..</>
    }

    function Page() {
      const query = useQuery({
        queryKey: key,
        queryFn: async () => {
          await sleep(1)
          return { name: 'test' }
        },
        select: (data) => data.name,
      })

      useTrackRenders()
      return (
        <React.Suspense fallback={<Loading />}>
          <MyComponent promise={query.promise} />
        </React.Suspense>
      )
    }

    await renderStream.render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('loading..')
      expect(renderedComponents).toEqual([Page, Loading])
    }

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('test')
      expect(renderedComponents).toEqual([MyComponent])
    }
  })

  it('should throw error if the promise fails', async () => {
    const renderStream = createRenderStream({ snapshotDOM: true })
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const key = queryKey()
    function MyComponent(props: { promise: Promise<string> }) {
      const data = React.use(props.promise)

      return <>{data}</>
    }

    function Loading() {
      return <>loading..</>
    }

    let queryCount = 0
    function Page() {
      const query = useQuery({
        queryKey: key,
        queryFn: async () => {
          await sleep(1)
          if (++queryCount > 1) {
            // second time this query mounts, it should not throw
            return 'data'
          }
          throw new Error('Error test')
        },
        retry: false,
      })

      return (
        <React.Suspense fallback={<Loading />}>
          <MyComponent promise={query.promise} />
        </React.Suspense>
      )
    }

    const rendered = await renderStream.render(
      <QueryClientProvider client={queryClient}>
        <QueryErrorResetBoundary>
          {({ reset }) => (
            <ErrorBoundary
              onReset={reset}
              fallbackRender={({ resetErrorBoundary }) => (
                <div>
                  <div>error boundary</div>
                  <button
                    onClick={() => {
                      resetErrorBoundary()
                    }}
                  >
                    resetErrorBoundary
                  </button>
                </div>
              )}
            >
              <Page />
            </ErrorBoundary>
          )}
        </QueryErrorResetBoundary>
      </QueryClientProvider>,
    )

    {
      const { withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('loading..')
    }

    {
      const { withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('error boundary')
    }

    consoleMock.mockRestore()

    rendered.getByText('resetErrorBoundary').click()

    {
      const { withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('loading..')
    }

    {
      const { withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('data')
    }

    expect(queryCount).toBe(2)
  })

  it('should throw error if the promise fails (colocate suspense and promise)', async () => {
    const renderStream = createRenderStream({ snapshotDOM: true })
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const key = queryKey()

    function MyComponent() {
      const query = useQuery({
        queryKey: key,
        queryFn: async () => {
          await sleep(1)
          throw new Error('Error test')
        },
        retry: false,
      })
      const data = React.use(query.promise)

      return <>{data}</>
    }

    function Page() {
      return (
        <React.Suspense fallback="loading..">
          <MyComponent />
        </React.Suspense>
      )
    }

    await renderStream.render(
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary fallbackRender={() => <div>error boundary</div>}>
          <Page />
        </ErrorBoundary>
      </QueryClientProvider>,
    )

    {
      const { withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('loading..')
    }

    {
      const { withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('error boundary')
    }

    consoleMock.mockRestore()
  })

  it('should recreate promise with data changes', async () => {
    const key = queryKey()
    const renderStream = createRenderStream({ snapshotDOM: true })

    function MyComponent(props: { promise: Promise<string> }) {
      useTrackRenders()
      const data = React.use(props.promise)

      return <>{data}</>
    }

    function Loading() {
      useTrackRenders()
      return <>loading..</>
    }
    function Page() {
      const query = useQuery({
        queryKey: key,
        queryFn: async () => {
          await sleep(1)
          return 'test1'
        },
      })

      useTrackRenders()
      return (
        <React.Suspense fallback={<Loading />}>
          <MyComponent promise={query.promise} />
        </React.Suspense>
      )
    }

    await renderStream.render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('loading..')
      expect(renderedComponents).toEqual([Page, Loading])
    }

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('test1')
      expect(renderedComponents).toEqual([MyComponent])
    }

    queryClient.setQueryData(key, 'test2')

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('test2')
      expect(renderedComponents).toEqual([Page, MyComponent])
    }
  })

  it('should dedupe when re-fetched with queryClient.fetchQuery while suspending', async () => {
    const key = queryKey()
    const renderStream = createRenderStream({ snapshotDOM: true })
    const queryFn = vi.fn().mockImplementation(async () => {
      await sleep(10)
      return 'test'
    })

    const options = {
      queryKey: key,
      queryFn,
    }

    function MyComponent(props: { promise: Promise<string> }) {
      const data = React.use(props.promise)

      return <>{data}</>
    }

    function Loading() {
      return <>loading..</>
    }
    function Page() {
      const query = useQuery(options)

      return (
        <div>
          <React.Suspense fallback={<Loading />}>
            <MyComponent promise={query.promise} />
          </React.Suspense>
          <button onClick={() => queryClient.fetchQuery(options)}>fetch</button>
        </div>
      )
    }

    const rendered = await renderStream.render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    {
      const { withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('loading..')
    }

    rendered.getByText('fetch').click()

    {
      const { withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('test')
    }

    expect(queryFn).toHaveBeenCalledOnce()
  })

  it('should dedupe when re-fetched with refetchQueries while suspending', async () => {
    const key = queryKey()
    let count = 0
    const renderStream = createRenderStream({ snapshotDOM: true })
    const queryFn = vi.fn().mockImplementation(async () => {
      await sleep(10)
      return 'test' + count++
    })

    const options = {
      queryKey: key,
      queryFn,
    }

    function MyComponent(props: { promise: Promise<string> }) {
      const data = React.use(props.promise)

      return <>{data}</>
    }

    function Loading() {
      return <>loading..</>
    }
    function Page() {
      const query = useQuery(options)

      return (
        <div>
          <React.Suspense fallback={<Loading />}>
            <MyComponent promise={query.promise} />
          </React.Suspense>
          <button onClick={() => queryClient.refetchQueries(options)}>
            refetch
          </button>
        </div>
      )
    }

    const rendered = await renderStream.render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    {
      const { withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('loading..')
    }

    rendered.getByText('refetch').click()

    {
      const { withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('test0')
    }

    expect(queryFn).toHaveBeenCalledOnce()
  })

  it('should stay pending when canceled with cancelQueries while suspending until refetched', async () => {
    const renderStream = createRenderStream({ snapshotDOM: true })
    const key = queryKey()
    let count = 0
    const queryFn = vi.fn().mockImplementation(async () => {
      await sleep(10)
      return 'test' + count++
    })

    const options = {
      queryKey: key,
      queryFn,
    }

    function MyComponent(props: { promise: Promise<string> }) {
      const data = React.use(props.promise)

      return <>{data}</>
    }

    function Loading() {
      return <>loading..</>
    }
    function Page() {
      const query = useQuery(options)

      return (
        <div>
          <React.Suspense fallback={<Loading />}>
            <MyComponent promise={query.promise} />
          </React.Suspense>
          <button onClick={() => queryClient.cancelQueries(options)}>
            cancel
          </button>
          <button
            onClick={() => queryClient.setQueryData<string>(key, 'hello')}
          >
            fetch
          </button>
        </div>
      )
    }

    const rendered = await renderStream.render(
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary fallbackRender={() => <>error boundary</>}>
          <Page />
        </ErrorBoundary>
      </QueryClientProvider>,
    )

    {
      const { withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('loading..')
    }

    rendered.getByText('cancel').click()

    {
      await renderStream.takeRender()
      expect(queryClient.getQueryState(key)).toMatchObject({
        status: 'pending',
        fetchStatus: 'idle',
      })
    }

    expect(queryFn).toHaveBeenCalledOnce()

    rendered.getByText('fetch').click()

    {
      const { withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('hello')
    }
  })

  it('should resolve to previous data when canceled with cancelQueries while suspending', async () => {
    const renderStream = createRenderStream({ snapshotDOM: true })
    const key = queryKey()
    const queryFn = vi.fn().mockImplementation(async () => {
      await sleep(10)
      return 'test'
    })

    const options = {
      queryKey: key,
      queryFn,
    }

    function MyComponent(props: { promise: Promise<string> }) {
      const data = React.use(props.promise)

      return <>{data}</>
    }

    function Loading() {
      return <>loading..</>
    }
    function Page() {
      const query = useQuery(options)

      return (
        <div>
          <React.Suspense fallback={<Loading />}>
            <MyComponent promise={query.promise} />
          </React.Suspense>
          <button onClick={() => queryClient.cancelQueries(options)}>
            cancel
          </button>
        </div>
      )
    }

    queryClient.setQueryData(key, 'initial')

    const rendered = await renderStream.render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    rendered.getByText('cancel').click()

    {
      const { withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('initial')
    }

    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should suspend when not enabled', async () => {
    const renderStream = createRenderStream({ snapshotDOM: true })
    const key = queryKey()

    const options = (count: number) => ({
      queryKey: [...key, count],
      queryFn: async () => {
        await sleep(10)
        return 'test' + count
      },
    })

    function MyComponent(props: { promise: Promise<string> }) {
      const data = React.use(props.promise)

      return <>{data}</>
    }

    function Loading() {
      return <>loading..</>
    }
    function Page() {
      const [count, setCount] = React.useState(0)
      const query = useQuery({ ...options(count), enabled: count > 0 })

      return (
        <div>
          <React.Suspense fallback={<Loading />}>
            <MyComponent promise={query.promise} />
          </React.Suspense>
          <button onClick={() => setCount(1)}>enable</button>
        </div>
      )
    }

    const rendered = await renderStream.render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    {
      const { withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('loading..')
    }

    rendered.getByText('enable').click()

    // loading re-render with enabled
    await renderStream.takeRender()

    {
      const { withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('test1')
    }
  })

  it('should show correct data when read from cache only (staleTime)', async () => {
    const key = queryKey()
    const renderStream = createRenderStream({ snapshotDOM: true })
    queryClient.setQueryData(key, 'initial')

    const queryFn = vi.fn().mockImplementation(async () => {
      await sleep(1)
      return 'test'
    })

    function MyComponent(props: { promise: Promise<string> }) {
      const data = React.use(props.promise)

      return <>{data}</>
    }

    function Loading() {
      return <>loading..</>
    }
    function Page() {
      const query = useQuery({
        queryKey: key,
        queryFn,
        staleTime: Infinity,
      })

      return (
        <React.Suspense fallback={<Loading />}>
          <MyComponent promise={query.promise} />
        </React.Suspense>
      )
    }

    await renderStream.render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    {
      const { withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('initial')
    }

    expect(queryFn).toHaveBeenCalledTimes(0)
  })

  it('should show correct data when switching between cache entries without re-fetches', async () => {
    const key = queryKey()
    const renderStream = createRenderStream({ snapshotDOM: true })

    function MyComponent(props: { promise: Promise<string> }) {
      useTrackRenders()
      const data = React.use(props.promise)

      return <>{data}</>
    }

    function Loading() {
      useTrackRenders()
      return <>loading..</>
    }
    function Page() {
      useTrackRenders()
      const [count, setCount] = React.useState(0)
      const query = useQuery({
        queryKey: [key, count],
        queryFn: async () => {
          await sleep(10)
          return 'test' + count
        },
        staleTime: Infinity,
      })

      return (
        <div>
          <React.Suspense fallback={<Loading />}>
            <MyComponent promise={query.promise} />
          </React.Suspense>
          <button onClick={() => setCount(count + 1)}>inc</button>
          <button onClick={() => setCount(count - 1)}>dec</button>
        </div>
      )
    }

    const rendered = await renderStream.render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('loading..')
      expect(renderedComponents).toEqual([Page, Loading])
    }

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('test0')
      expect(renderedComponents).toEqual([MyComponent])
    }

    rendered.getByText('inc').click()

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('loading..')
      expect(renderedComponents).toEqual([Page, Loading])
    }

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('test1')
      expect(renderedComponents).toEqual([MyComponent])
    }

    rendered.getByText('dec').click()

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('test0')
      expect(renderedComponents).toEqual([Page, MyComponent])
    }
  })

  it('should not resolve with intermediate data when keys are switched', async () => {
    const key = queryKey()
    const renderStream = createRenderStream<{ data: string }>({
      snapshotDOM: true,
    })

    function MyComponent(props: { promise: Promise<string> }) {
      const data = React.use(props.promise)

      renderStream.replaceSnapshot({ data })

      return <>{data}</>
    }

    function Loading() {
      return <>loading..</>
    }
    function Page() {
      const [count, setCount] = React.useState(0)
      const query = useQuery({
        queryKey: [key, count],
        queryFn: async () => {
          await sleep(10)
          return 'test' + count
        },
        staleTime: Infinity,
      })

      return (
        <div>
          <React.Suspense fallback={<Loading />}>
            <MyComponent promise={query.promise} />
          </React.Suspense>
          <button onClick={() => setCount(count + 1)}>inc</button>
        </div>
      )
    }

    const rendered = await renderStream.render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    {
      const { withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('loading..')
    }

    {
      const { snapshot, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('test0')
      expect(snapshot).toMatchObject({ data: 'test0' })
    }

    rendered.getByText('inc').click()

    {
      const { withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('loading..')
    }

    rendered.getByText('inc').click()
    await renderStream.takeRender()

    rendered.getByText('inc').click()
    await renderStream.takeRender()

    {
      const { snapshot, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('test3')
      expect(snapshot).toMatchObject({ data: 'test3' })
    }
  })

  it('should not resolve with intermediate data when keys are switched (with background updates)', async () => {
    const key = queryKey()
    const renderStream = createRenderStream<{ data: string }>({
      snapshotDOM: true,
    })
    let modifier = ''

    function MyComponent(props: { promise: Promise<string> }) {
      const data = React.use(props.promise)

      renderStream.replaceSnapshot({ data })

      return <>{data}</>
    }

    function Loading() {
      return <>loading..</>
    }
    function Page() {
      const [count, setCount] = React.useState(0)
      const query = useQuery({
        queryKey: [key, count],
        queryFn: async () => {
          await sleep(10)
          return 'test' + count + modifier
        },
      })

      return (
        <div>
          <React.Suspense fallback={<Loading />}>
            <MyComponent promise={query.promise} />
          </React.Suspense>
          <button onClick={() => setCount(count + 1)}>inc</button>
          <button onClick={() => setCount(count - 1)}>dec</button>
        </div>
      )
    }

    const rendered = await renderStream.render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    {
      const { withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('loading..')
    }

    {
      const { snapshot, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('test0')
      expect(snapshot).toMatchObject({ data: 'test0' })
    }

    rendered.getByText('inc').click()
    {
      const { snapshot } = await renderStream.takeRender()
      expect(snapshot).toMatchObject({ data: 'test0' })
    }

    rendered.getByText('inc').click()
    {
      const { snapshot } = await renderStream.takeRender()
      expect(snapshot).toMatchObject({ data: 'test0' })
    }

    rendered.getByText('inc').click()

    {
      const { snapshot, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('loading..')
      expect(snapshot).toMatchObject({ data: 'test0' })
    }

    {
      const { snapshot, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('test3')
      expect(snapshot).toMatchObject({ data: 'test3' })
    }

    modifier = 'new'

    rendered.getByText('dec').click()
    {
      const { snapshot } = await renderStream.takeRender()
      expect(snapshot).toMatchObject({ data: 'test2' })
    }

    rendered.getByText('dec').click()
    {
      const { snapshot } = await renderStream.takeRender()
      expect(snapshot).toMatchObject({ data: 'test1' })
    }

    rendered.getByText('dec').click()
    {
      const { snapshot } = await renderStream.takeRender()
      expect(snapshot).toMatchObject({ data: 'test0' })
    }

    {
      const { snapshot, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('test0new')
      expect(snapshot).toMatchObject({ data: 'test0new' })
    }
  })

  it('should not suspend indefinitely with multiple, nested observers)', async () => {
    const key = queryKey()
    const renderStream = createRenderStream({ snapshotDOM: true })

    function MyComponent({ input }: { input: string }) {
      const query = useTheQuery(input)
      const data = React.use(query.promise)

      return <>{data}</>
    }

    function useTheQuery(input: string) {
      return useQuery({
        staleTime: Infinity,
        queryKey: [key, input],
        queryFn: async () => {
          await sleep(1)
          return input + ' response'
        },
      })
    }

    function Page() {
      const [input, setInput] = React.useState('defaultInput')
      useTheQuery(input)

      return (
        <div>
          <button onClick={() => setInput('someInput')}>setInput</button>
          <React.Suspense fallback="loading..">
            <MyComponent input={input} />
          </React.Suspense>
        </div>
      )
    }

    const rendered = await renderStream.render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    {
      const { withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('loading..')
    }

    {
      const { withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('defaultInput response')
    }

    expect(
      queryClient.getQueryCache().find({ queryKey: [key, 'defaultInput'] })!
        .observers.length,
    ).toBe(2)

    rendered.getByText('setInput').click()

    {
      const { withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('loading..')
    }

    {
      const { withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('someInput response')
    }

    expect(
      queryClient.getQueryCache().find({ queryKey: [key, 'defaultInput'] })!
        .observers.length,
    ).toBe(0)

    expect(
      queryClient.getQueryCache().find({ queryKey: [key, 'someInput'] })!
        .observers.length,
    ).toBe(2)
  })
})
