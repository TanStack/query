import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import {act, render, screen} from '@testing-library/react'
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
    global.IS_REACT_ACT_ENVIRONMENT = true;
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
    vi.useFakeTimers()

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
      })

      const data = React.use(query.promise)

      return (
        <div>
          <button
            onClick={() => startTransition(() => setCount((c) => c + 1))}
          >
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
          <React.Suspense fallback={<Loading/>}>
            <Page/>
          </React.Suspense>
        </QueryClientProvider>,
        );
    });
    screen.getByText('loading...')
    expect(screen.queryByText('button')).toBeNull()
    expect(screen.queryByText('pending...')).toBeNull()
    expect(screen.queryByText('data: test0')).toBeNull()

    // Resolve the query, should show the data
    await act(async () => {
      vi.runAllTimers();
    });
    expect(screen.queryByText('loading...')).toBeNull()
    screen.getByRole('button')
    expect(screen.queryByText('pending...')).toBeNull()
    screen.getByText('data: test0');

    // Update in a transition, should show pending state, and existing content
    await act(async () => {
      screen.getByRole('button', {name: 'increment'}).click()
    });
    expect(screen.queryByText('loading...')).toBeNull()
    screen.getByRole('button')
    screen.getByText('pending...')
    screen.getByText('data: test0');


    await act(async () => {
      screen.getByRole('button', {name: 'increment'}).click()
    });

    // Resolve the query, should show the new data and no pending state
    await act(async () => {
      vi.runAllTimers();
    });
    expect(screen.queryByText('loading...')).toBeNull()
    screen.getByRole('button')
    expect(screen.queryByText('pending...')).toBeNull()
    screen.getByText('data: test2');
  })
})