import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { act, fireEvent, waitFor } from '@testing-library/react'
import * as React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import {
  cleanup,
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
import { createQueryClient, queryKey, renderWithClient, sleep } from './utils'

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

  afterEach(cleanup)

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

      return data
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
      expect(renderedComponents).toEqual([Page, MyComponent])
    }

    fireEvent.click(rendered.getByRole('button', { name: 'increment' }))

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
      expect(renderedComponents).toEqual([Page, MyComponent])
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

    // fireEvent.click(rendered.getByText('resetErrorBoundary'))
    await act(() => fireEvent.click(rendered.getByText('resetErrorBoundary')))

    // resetErrorBoundary render
    await renderStream.takeRender()

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
      expect(renderedComponents).toEqual([Page, MyComponent])
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

    fireEvent.click(rendered.getByText('fetch'))

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

    fireEvent.click(rendered.getByText('refetch'))

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

    fireEvent.click(rendered.getByText('cancel'))

    {
      await renderStream.takeRender()
      expect(queryClient.getQueryState(key)).toMatchObject({
        status: 'pending',
        fetchStatus: 'idle',
      })
    }

    expect(queryFn).toHaveBeenCalledOnce()

    fireEvent.click(rendered.getByText('fetch'))

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

    fireEvent.click(rendered.getByText('cancel'))

    {
      const { withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('initial')
    }

    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should suspend when not enabled', async () => {
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

    const rendered = renderWithClient(queryClient, <Page />)
    await waitFor(() => rendered.getByText('loading..'))
    fireEvent.click(rendered.getByText('enable'))
    await waitFor(() => rendered.getByText('test1'))
  })

  it('should show correct data when read from cache only (staleTime)', async () => {
    const key = queryKey()
    let suspenseRenderCount = 0
    queryClient.setQueryData(key, 'initial')

    function MyComponent(props: { promise: Promise<string> }) {
      const data = React.use(props.promise)

      return <>{data}</>
    }

    function Loading() {
      suspenseRenderCount++
      return <>loading..</>
    }
    function Page() {
      const query = useQuery({
        queryKey: key,
        queryFn: async () => {
          await sleep(1)
          return 'test'
        },
        staleTime: Infinity,
      })

      return (
        <React.Suspense fallback={<Loading />}>
          <MyComponent promise={query.promise} />
        </React.Suspense>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)
    await waitFor(() => rendered.getByText('initial'))

    expect(suspenseRenderCount).toBe(0)
  })

  it('should show correct data when switching between cache entries without re-fetches', async () => {
    const key = queryKey()
    let suspenseRenderCount = 0

    function MyComponent(props: { promise: Promise<string> }) {
      const data = React.use(props.promise)

      return <>{data}</>
    }

    function Loading() {
      suspenseRenderCount++
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
          <button onClick={() => setCount(count - 1)}>dec</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)
    await waitFor(() => rendered.getByText('loading..'))
    await waitFor(() => rendered.getByText('test0'))

    expect(suspenseRenderCount).toBe(1)

    fireEvent.click(rendered.getByText('inc'))
    await waitFor(() => rendered.getByText('loading..'))
    await waitFor(() => rendered.getByText('test1'))

    expect(suspenseRenderCount).toBe(2)

    fireEvent.click(rendered.getByText('dec'))
    await waitFor(() => rendered.getByText('test0'))

    // no more suspending when going back to test0
    expect(suspenseRenderCount).toBe(2)
  })

  it('should not resolve with intermediate data when keys are switched', async () => {
    const key = queryKey()
    const renderedData: Array<string> = []

    function MyComponent(props: { promise: Promise<string> }) {
      const data = React.use(props.promise)

      renderedData.push(data)

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

    const rendered = renderWithClient(queryClient, <Page />)
    await waitFor(() => rendered.getByText('loading..'))
    await waitFor(() => rendered.getByText('test0'))

    fireEvent.click(rendered.getByText('inc'))
    fireEvent.click(rendered.getByText('inc'))
    fireEvent.click(rendered.getByText('inc'))

    await waitFor(() => rendered.getByText('loading..'))

    await waitFor(() => rendered.getByText('test3'))

    expect(renderedData).toEqual(['test0', 'test3'])
  })

  it('should not resolve with intermediate data when keys are switched (with background updates)', async () => {
    const key = queryKey()
    const renderedData: Array<string> = []
    let modifier = ''

    function MyComponent(props: { promise: Promise<string> }) {
      const data = React.use(props.promise)

      renderedData.push(data)

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

    const rendered = renderWithClient(queryClient, <Page />)
    await waitFor(() => rendered.getByText('loading..'))
    await waitFor(() => rendered.getByText('test0'))

    fireEvent.click(rendered.getByText('inc'))
    await sleep(1)
    fireEvent.click(rendered.getByText('inc'))
    await sleep(7)
    fireEvent.click(rendered.getByText('inc'))
    await sleep(5)

    await waitFor(() => rendered.getByText('loading..'))

    await waitFor(() => rendered.getByText('test3'))

    modifier = 'new'

    fireEvent.click(rendered.getByText('dec'))
    fireEvent.click(rendered.getByText('dec'))
    fireEvent.click(rendered.getByText('dec'))

    await waitFor(() => rendered.getByText('test0new'))

    expect(renderedData).toEqual([
      'test0', // fresh data
      'test3', // fresh data
      'test2', // stale data
      'test1', // stale data
      'test0', // stale data
      'test0new', // fresh data, background refetch, only for latest
    ])
  })

  it('should not suspend indefinitely with multiple, nested observers)', async () => {
    const key = queryKey()

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

    const rendered = renderWithClient(queryClient, <Page />)
    await waitFor(() => rendered.getByText('loading..'))
    await waitFor(() => rendered.getByText('defaultInput response'))

    expect(
      queryClient.getQueryCache().find({ queryKey: [key, 'defaultInput'] })!
        .observers.length,
    ).toBe(2)

    fireEvent.click(rendered.getByText('setInput'))

    await waitFor(() => rendered.getByText('loading..'))
    await waitFor(() => rendered.getByText('someInput response'))

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
