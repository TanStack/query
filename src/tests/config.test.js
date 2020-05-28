import React, { useState } from 'react'
import {
  act,
  fireEvent,
  render,
  waitForElement,
  cleanup,
} from '@testing-library/react'
import {
  ReactQueryConfigProvider,
  useQuery,
  queryCache,
  ReactQueryCacheProvider,
} from '../index'

import { sleep } from './utils'

describe('config', () => {
  afterEach(() => {
    queryCache.clear()
  })

  // See https://github.com/tannerlinsley/react-query/issues/105
  it('should allow overriding the config with ReactQueryConfigProvider', async () => {
    const onSuccess = jest.fn()

    const config = {
      onSuccess,
    }

    function Page() {
      const { status } = useQuery('test', async () => {
        await sleep(10)
        return 'data'
      })

      return (
        <div>
          <h1>Status: {status}</h1>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryConfigProvider config={config}>
        <ReactQueryCacheProvider>
          <Page />
        </ReactQueryCacheProvider>
      </ReactQueryConfigProvider>
    )

    await waitForElement(() => rendered.getByText('Status: success'))

    expect(onSuccess).toHaveBeenCalledWith('data')
  })

  it('should reset to defaults when all providers are unmounted', async () => {
    const onSuccess = jest.fn()

    const config = {
      refetchAllOnWindowFocus: false,
      refetchOnMount: false,
      retry: false,
      manual: true,
    }

    const queryFn = async () => {
      await sleep(10)
      return 'data'
    }

    function Page() {
      const { data } = useQuery('test', queryFn)

      return (
        <div>
          <h1>Data: {data || 'none'}</h1>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryConfigProvider config={config}>
        <Page />
      </ReactQueryConfigProvider>
    )

    await rendered.findByText('Data: none')

    act(() => {
      queryCache.prefetchQuery('test', queryFn, { force: true })
    })

    await rendered.findByText('Data: data')

    // tear down and unmount
    cleanup()

    // wipe query cache/stored config
    act(() => queryCache.clear())
    onSuccess.mockClear()

    // rerender WITHOUT config provider,
    // so we are NOT passing the config above (refetchOnMount should be `true` by default)
    const rerendered = render(<Page />)

    await rerendered.findByText('Data: data')
  })

  it('should reset to previous config when nested provider is unmounted', async () => {
    let counterRef = 0
    const parentOnSuccess = jest.fn()

    const parentConfig = {
      refetchOnMount: false,
      onSuccess: parentOnSuccess,
    }

    const childConfig = {
      refetchOnMount: true,

      // Override onSuccess of parent, making it a no-op
      onSuccess: undefined,
    }

    const queryFn = async () => {
      await sleep(10)
      counterRef += 1
      return String(counterRef)
    }

    function Component() {
      const { data, refetch } = useQuery('test', queryFn)

      return (
        <div>
          <h1>Data: {data}</h1>
          <button data-testid="refetch" onClick={() => refetch()}>
            Refetch
          </button>
        </div>
      )
    }

    function Page() {
      const [childConfigEnabled, setChildConfigEnabled] = useState(true)

      return (
        <div>
          {childConfigEnabled && (
            <ReactQueryConfigProvider config={childConfig}>
              <Component />
            </ReactQueryConfigProvider>
          )}
          {!childConfigEnabled && <Component />}
          <button
            data-testid="disableChildConfig"
            onClick={() => setChildConfigEnabled(false)}
          >
            Disable Child Config
          </button>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryConfigProvider config={parentConfig}>
        <ReactQueryCacheProvider>
          <Page />
        </ReactQueryCacheProvider>
      </ReactQueryConfigProvider>
    )

    await rendered.findByText('Data: 1')

    expect(parentOnSuccess).not.toHaveBeenCalled()

    fireEvent.click(rendered.getByTestId('refetch'))

    await rendered.findByText('Data: 2')

    expect(parentOnSuccess).not.toHaveBeenCalled()

    parentOnSuccess.mockReset()

    fireEvent.click(rendered.getByTestId('disableChildConfig'))

    await rendered.findByText('Data: 2')

    // it should not refetch on mount
    expect(parentOnSuccess).not.toHaveBeenCalled()

    fireEvent.click(rendered.getByTestId('refetch'))

    await rendered.findByText('Data: 3')

    expect(parentOnSuccess).toHaveBeenCalledTimes(1)
  })
})
