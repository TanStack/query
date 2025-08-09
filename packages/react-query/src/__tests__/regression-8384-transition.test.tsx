/* eslint-disable @typescript-eslint/require-await */
import { act, render, screen } from '@testing-library/react'
import * as React from 'react'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
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

  it('should keep values of old key around with startTransition', async () => {
    const key = queryKey()
    const resolveByCount: Record<number, () => void> = {}

    function Loading() {
      return <>loading...</>
    }

    function Page() {
      const [isPending, startTransition] = React.useTransition()
      const [count, setCount] = React.useState(0)
      const query = useQuery({
        queryKey: [key, count],
        queryFn: async () => {
          await new Promise<void>((resolve) => {
            resolveByCount[count] = resolve
          })
          return 'test' + count
        },
      })

      const data = React.use(query.promise)

      return (
        <div>
          <button onClick={() => startTransition(() => setCount((c) => c + 1))}>
            increment
          </button>
          {isPending && <span>pending...</span>}
          <div>data: {data}</div>
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
      resolveByCount[0]!()
    })
    // HELP WANTED - get the below to fail as the repro does
    expect(screen.queryByText('loading...')).toBeNull()
    screen.getByRole('button')
    expect(screen.queryByText('pending...')).toBeNull()
    screen.getByText('data: test0')

    // Update in a transition, should show pending state, and existing content
    await act(async () => {
      for (let i = 0; i < 100; i++) {
        screen.getByRole('button', { name: 'increment' }).click()
      }
    })

    // resolve all
    for (const resolve of Object.values(resolveByCount)) {
      await sleep(1)
      await act(async () => {
        resolve()
      })
    }

    expect(screen.queryByText('loading...')).toBeNull()
    expect(screen.queryByText('pending...')).toBeNull()
    screen.getByText('data: test100')
  })
})
