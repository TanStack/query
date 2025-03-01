import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import * as React from 'react'
import {
  createRenderStream,
  useTrackRenders,
} from '@testing-library/react-render-stream'
import { QueryClientProvider, useQuery } from '..'
import { QueryCache } from '../index'
import { createQueryClient, queryKey, sleep } from './utils'

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
      withinDOM().getByText('data: test0')
      expect(renderedComponents).toEqual([Page])
    }

    {
      const { renderedComponents, withinDOM } = await renderStream.takeRender()
      withinDOM().getByText('data: test1')
      expect(renderedComponents).toEqual([Page])
    }
  })
})
