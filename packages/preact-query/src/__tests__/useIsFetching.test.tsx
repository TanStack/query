import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/preact'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { QueryCache, QueryClient, useIsFetching, useQuery } from '..'
import { renderWithClient, setActTimeout } from './utils'
import { useEffect, useState } from 'preact/hooks'

describe('useIsFetching', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // See https://github.com/tannerlinsley/react-query/issues/105
  it('should update as queries start and stop fetching', async () => {
    const queryClient = new QueryClient()
    const key = queryKey()

    function IsFetching() {
      const isFetching = useIsFetching()

      return <div>isFetching: {isFetching}</div>
    }

    function Query() {
      const [ready, setReady] = useState(false)

      useQuery({
        queryKey: key,
        queryFn: () => sleep(50).then(() => 'test'),
        enabled: ready,
      })

      return <button onClick={() => setReady(true)}>setReady</button>
    }

    function Page() {
      return (
        <div>
          <IsFetching />
          <Query />
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    expect(rendered.getByText('isFetching: 0')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /setReady/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('isFetching: 1')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(51)
    expect(rendered.getByText('isFetching: 0')).toBeInTheDocument()
  })

  it('should not update state while rendering', async () => {
    const queryClient = new QueryClient()

    const key1 = queryKey()
    const key2 = queryKey()

    const isFetchingArray: Array<number> = []

    function IsFetching() {
      const isFetching = useIsFetching()

      isFetchingArray.push(isFetching)

      return null
    }

    function FirstQuery() {
      useQuery({
        queryKey: key1,
        queryFn: () => sleep(100).then(() => 'data1'),
      })

      return null
    }

    function SecondQuery() {
      useQuery({
        queryKey: key2,
        queryFn: () => sleep(100).then(() => 'data2'),
      })

      return null
    }

    function Page() {
      const [renderSecond, setRenderSecond] = useState(false)

      useEffect(() => {
        setActTimeout(() => {
          setRenderSecond(true)
        }, 50)
      }, [])

      return (
        <>
          <IsFetching />
          <FirstQuery />
          {renderSecond && <SecondQuery />}
        </>
      )
    }

    renderWithClient(queryClient, <Page />)

    expect(isFetchingArray[0]).toEqual(0)
    await vi.advanceTimersByTimeAsync(0)
    expect(isFetchingArray[1]).toEqual(1)
    await vi.advanceTimersByTimeAsync(50)
    expect(isFetchingArray[2]).toEqual(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(isFetchingArray[3]).toEqual(2)
    await vi.advanceTimersByTimeAsync(50)
    expect(isFetchingArray[4]).toEqual(1)
    await vi.advanceTimersByTimeAsync(50)
    expect(isFetchingArray[5]).toEqual(0)

    expect(isFetchingArray).toEqual([0, 1, 1, 2, 1, 0])
  })

  it('should be able to filter', async () => {
    const queryClient = new QueryClient()
    const key1 = queryKey()
    const key2 = queryKey()

    const isFetchingArray: Array<number> = []

    function One() {
      useQuery({
        queryKey: key1,
        queryFn: () => sleep(10).then(() => 'test1'),
      })

      return null
    }

    function Two() {
      useQuery({
        queryKey: key2,
        queryFn: () => sleep(20).then(() => 'test2'),
      })

      return null
    }

    function Page() {
      const [started, setStarted] = useState(false)
      const isFetching = useIsFetching({ queryKey: key1 })

      isFetchingArray.push(isFetching)

      return (
        <div>
          <button onClick={() => setStarted(true)}>setStarted</button>
          <div>isFetching: {isFetching}</div>
          {started ? (
            <>
              <One />
              <Two />
            </>
          ) : null}
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    expect(rendered.getByText('isFetching: 0')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /setStarted/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('isFetching: 1')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('isFetching: 0')).toBeInTheDocument()

    // at no point should we have isFetching: 2
    expect(isFetchingArray).toEqual(expect.not.arrayContaining([2]))
  })

  it('should show the correct fetching state when mounted after a query', async () => {
    const queryClient = new QueryClient()
    const key = queryKey()

    function Page() {
      useQuery({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'test'),
      })

      const isFetching = useIsFetching()

      return (
        <div>
          <div>isFetching: {isFetching}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    expect(rendered.getByText('isFetching: 1')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('isFetching: 0')).toBeInTheDocument()
  })

  it('should use provided custom queryClient', async () => {
    const onSuccess = vi.fn()

    const queryCache = new QueryCache({ onSuccess })
    const queryClient = new QueryClient({ queryCache })
    const key = queryKey()

    function Page() {
      useQuery(
        {
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'test'),
        },
        queryClient,
      )

      const isFetching = useIsFetching({}, queryClient)

      return (
        <div>
          <div>isFetching: {isFetching}</div>
        </div>
      )
    }

    const rendered = render(<Page />)

    expect(rendered.getByText('isFetching: 1')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('isFetching: 0')).toBeInTheDocument()
    expect(onSuccess).toHaveBeenCalledOnce()
  })
})
