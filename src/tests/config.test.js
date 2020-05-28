import React from 'react'
import { fireEvent, render, waitForElement, cleanup } from '@testing-library/react'
import {
  ReactQueryConfigProvider,
  useQuery,
  queryCache,
  ReactQueryCacheProvider,
} from '../index'

import { sleep } from './utils'

describe('config', () => {
  afterEach(() => {
    cleanup()
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

  test('should reset to defaults when all providers are unmounted', async () => {
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
        <Page />
      </ReactQueryConfigProvider>
    )

    await waitForElement(() => rendered.getByText('Status: success'))

    const onError = jest.fn()
    const newConfig = {
      onError,
    }

    rendered.unmount()
    onSuccess.mockClear()

    const renderedAgain = render(
      <ReactQueryConfigProvider config={newConfig}>
        <Page />
      </ReactQueryConfigProvider>
    )

    await waitForElement(() => renderedAgain.getByText('Status: success'))

    expect(onSuccess).not.toHaveBeenCalled()
  })

  test('should reset to previous config when nested provider is unmounted', async () => {
    const onParentSuccess = jest.fn()
    const onChildSuccess = jest.fn()
    let counterRef = 0

    const parentConfig = {
      parent: true,
      onSuccess: onParentSuccess,
    }

    const childConfig = {
      child: true,
      onSuccess: onChildSuccess,
    }

    function Component() {
      const { data } = useQuery('test', async () => {
        await sleep(10)
        counterRef += 1
        return String(counterRef)
      })

      return (
        <div>
          <h1>Data: {data}</h1>
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
        <Page />
      </ReactQueryConfigProvider>
    )

    await rendered.findByText('Data: 1')

    expect(queryCache.getQuery('test').config.parent).toBe(true)
    expect(queryCache.getQuery('test').config.child).toBe(true)

    expect(onChildSuccess).toHaveBeenCalled()
    expect(onParentSuccess).not.toHaveBeenCalled()

    onChildSuccess.mockClear()
    onParentSuccess.mockClear()

    fireEvent.click(rendered.getByTestId('disableChildConfig'))

    await rendered.findByText('Data: 2')

    expect(queryCache.getQuery('test').config.parent).toBe(true)
    expect(queryCache.getQuery('test').config.child).toBeUndefined()

    expect(onChildSuccess).not.toHaveBeenCalled()
    expect(onParentSuccess).toHaveBeenCalled()
  })
})
