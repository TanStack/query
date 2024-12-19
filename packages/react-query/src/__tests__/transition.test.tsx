import { afterAll, beforeAll, describe, expect, it, } from 'vitest'
import * as React from 'react'
import {
  createRenderStream,
  disableActEnvironment,
  useTrackRenders,
} from '@testing-library/react-render-stream'
import { QueryClientProvider, useQuery } from '..'
import { QueryCache } from '../index'
import { createQueryClient, queryKey, sleep } from './utils'

let disableActReturn: ReturnType<typeof disableActEnvironment>
beforeAll(() => {
  disableActReturn = disableActEnvironment()
})
afterAll(() => {
  disableActReturn.cleanup()
})


describe('react transitions', () => {
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

  it('should keep values of old key around with startTransition', async () => {
    const key = queryKey()

    const renderStream = createRenderStream({ snapshotDOM: true })

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
        staleTime: 1000, // prevent data from being fetched on second mount after suspense
      })

      const data = React.use(query.promise)

      return (
        <div>
          <button
            onClick={() => React.startTransition(() => setCount((c) => c + 1))}
          >
            increment
          </button>
          <div>data: {data}</div>
        </div>
      )
    }

    const rendered = await renderStream.render(
      <QueryClientProvider client={queryClient}>
        <React.Suspense fallback={<Loading />}>
          <Page />
        </React.Suspense>
      </QueryClientProvider>,
    )

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('loading..')
      expect(renderedComponents).toEqual([Loading])
    }

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('data: test0')
      expect(renderedComponents).toEqual([Page])
    }

    rendered.getByRole('button', { name: 'increment' }).click()

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('data: test1')
      expect(renderedComponents).toEqual([Page])
    }
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

  it.only('should handle parallel queries with shared parent key in transition', async () => {
    const renderStream = createRenderStream({ snapshotDOM: true })

    let deferredA = createDeferred<void>()
    let deferredB = createDeferred<void>()
    
    

    function ComponentA(props: { parentId: number }) {
      useTrackRenders()
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
      useTrackRenders()
      return <div>A loading..</div>
    }

    function ComponentB(props: { parentId: number }) {
      useTrackRenders()
      const query = useQuery({
        queryKey: ['B', props.parentId],
        queryFn: async () => {
          console.log('B loading', props.parentId)
          await deferredB.promise
          console.log('B loaded', props.parentId)
          deferredB = createDeferred()
          return `B-${props.parentId}`
        },
        staleTime: 1000,
      })

      

      const data = React.use(query.promise)

      console.log('render B', data)
      return <div>B data: {data}</div>
    }
    function ComponentBLoading() {
      useTrackRenders()
      return <div>B loading..</div>
    }

    function Parent() {
      useTrackRenders()
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
      expect(renderedComponents).toEqual([Parent, ComponentBLoading, ComponentALoading])
    }

    deferredA.resolve()
    deferredB.resolve()

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('A data: A-0')
      withinDOM().getByText('B data: B-0')
      expect(renderedComponents).toEqual([ComponentB, ComponentA])
    }

    rendered.getByRole('button', { name: 'increment' }).click()

    deferredA.resolve()
    deferredB.resolve()

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('A data: A-1')
      withinDOM().getByText('B data: B-1')
      expect(renderedComponents).toEqual([Parent, ComponentB, ComponentA])
    }

  })
})
