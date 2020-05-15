import React from 'react'
import { render, waitForElement, cleanup } from '@testing-library/react'
import {
  ReactQueryConfigProvider,
  useQuery,
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
})
