import {
  cleanup,
  render,
  fireEvent,
  waitForElement,
} from '@testing-library/react'
import * as React from 'react'

import { useQuery, ReactQueryCacheProvider, useIsFetching } from '../index'
import { sleep } from './utils'

describe('useIsFetching', () => {
  afterEach(() => {
    cleanup()
  })

  // See https://github.com/tannerlinsley/react-query/issues/105
  it('should update as queries start and stop fetching', async () => {
    function Page() {
      const [ready, setReady] = React.useState(false)

      const isFetching = useIsFetching()

      useQuery(ready && 'test', async () => {
        await sleep(1000)
        return 'test'
      })

      return (
        <div>
          <div>isFetching: {isFetching.toString()}</div>
          <button onClick={() => setReady(true)}>setReady</button>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

    rendered.getByText('isFetching: 0')
    fireEvent.click(rendered.getByText('setReady'))
    await waitForElement(() => rendered.getByText('isFetching: 1'))
    await waitForElement(() => rendered.getByText('isFetching: 0'))
  })
})
