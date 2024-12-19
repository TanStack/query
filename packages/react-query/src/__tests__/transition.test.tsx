/* eslint-disable @typescript-eslint/require-await */
import { act, render, screen } from '@testing-library/react'
import * as React from 'react'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { QueryClientProvider, useQuery } from '..'
import { QueryCache } from '../index'
import { createQueryClient, queryKey, sleep } from './utils'

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
  vi.useFakeTimers()
})
afterAll(() => {
  queryClient.setDefaultOptions({
    queries: { experimental_prefetchInRender: false },
  })
  vi.useRealTimers()
})

it('should keep values of old key around with startTransition', async () => {
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

it('should handle parallel queries with shared parent key in transition', async () => {
  function ComponentA(props: { parentId: number }) {
    const query = useQuery({
      queryKey: ['A', props.parentId],
      queryFn: async () => {
        await sleep(10)
        return `A-${props.parentId}`
      },
      staleTime: 1000,
    })

    const data = React.use(query.promise)
    return <div>A data: {data}</div>
  }

  function ComponentALoading() {
    return <div>A loading...</div>
  }

  function ComponentB(props: { parentId: number }) {
    const query = useQuery({
      queryKey: ['B', props.parentId],
      queryFn: async () => {
        await sleep(10)
        return `B-${props.parentId}`
      },
      staleTime: 1000,
    })

    const data = React.use(query.promise)
    return <div>B data: {data}</div>
  }

  function ComponentBLoading() {
    return <div>B loading...</div>
  }

  function Parent() {
    const [count, setCount] = React.useState(0)
    const [isPending, startTransition] = React.useTransition()
    return (
      <div>
        <button onClick={() => startTransition(() => setCount((c) => c + 1))}>
          increment
        </button>
        <React.Suspense fallback={<ComponentALoading />}>
          <ComponentA parentId={count} />
        </React.Suspense>
        <React.Suspense fallback={<ComponentBLoading />}>
          <ComponentB parentId={count} />
        </React.Suspense>
        {isPending && <span>pending...</span>}
      </div>
    )
  }

  // Initial render should show fallback
  await act(async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Parent />
      </QueryClientProvider>,
    )
  })

  screen.getByText('A loading...')
  screen.getByText('B loading...')

  // Resolve the query, should show the data
  await act(async () => {
    vi.runAllTimers()
  })

  screen.getByText('A data: A-0')
  screen.getByText('B data: B-0')

  // Update in a transition, should show pending state, and existing content
  await act(async () => {
    screen.getByRole('button', { name: 'increment' }).click()
  })

  screen.getByText('pending...')
  screen.getByText('A data: A-0')
  screen.getByText('B data: B-0')

  // Resolve the query, should show the new data and no pending state
  await act(async () => {
    vi.runAllTimers()
  })
  screen.getByText('A data: A-1')
  screen.getByText('B data: B-1')
  expect(screen.queryByText('pending...')).toBeNull()
})
