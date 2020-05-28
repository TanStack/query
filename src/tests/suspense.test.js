import {
  render,
  waitForElement,
  fireEvent,
  cleanup,
} from '@testing-library/react'
import * as React from 'react'

import { useQuery, ReactQueryCacheProvider, queryCache } from '../index'
import { sleep } from './utils'

describe("useQuery's in Suspense mode", () => {
  afterEach(() => {
    cleanup()
  })

  it('should not call the queryFn twice when used in Suspense mode', async () => {
    const queryFn = jest.fn()
    queryFn.mockImplementation(() => sleep(10))

    function Page() {
      useQuery(['test'], queryFn, { suspense: true })

      return 'rendered'
    }

    const rendered = render(
      <ReactQueryCacheProvider>
        <React.Suspense fallback="loading">
          <Page />
        </React.Suspense>
      </ReactQueryCacheProvider>
    )

    await waitForElement(() => rendered.getByText('rendered'))

    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should remove query instance when component unmounted', async () => {
    const QUERY_KEY = 'test'

    function Page() {
      useQuery([QUERY_KEY], () => sleep(10), { suspense: true })

      return 'rendered'
    }

    function App() {
      const [show, setShow] = React.useState(false)

      return (
        <>
          <React.Suspense fallback="loading">{show && <Page />}</React.Suspense>
          <button aria-label="toggle" onClick={() => setShow(prev => !prev)} />
        </>
      )
    }

    const rendered = render(<App />)

    expect(rendered.queryByText('rendered')).toBeNull()
    expect(queryCache.getQuery(QUERY_KEY)).toBeFalsy()

    fireEvent.click(rendered.getByLabelText('toggle'))
    await waitForElement(() => rendered.getByText('rendered'))

    expect(queryCache.getQuery(QUERY_KEY).instances.length).toBe(1)

    fireEvent.click(rendered.getByLabelText('toggle'))

    expect(rendered.queryByText('rendered')).toBeNull()
    expect(queryCache.getQuery(QUERY_KEY).instances.length).toBe(0)
  })

  it('should call onSuccess on the first successful call', async () => {
    const successFn = jest.fn()

    function Page() {
      useQuery(['test'], () => sleep(10), {
        suspense: true,
        onSuccess: successFn,
      })

      return 'rendered'
    }

    const rendered = render(
      <ReactQueryCacheProvider>
        <React.Suspense fallback="loading">
          <Page />
        </React.Suspense>
      </ReactQueryCacheProvider>
    )

    await waitForElement(() => rendered.getByText('rendered'))

    expect(successFn).toHaveBeenCalledTimes(1)
  })
})
