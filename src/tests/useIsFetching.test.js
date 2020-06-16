import { render, fireEvent, waitFor, act } from '@testing-library/react'
import * as React from 'react'

import { useQuery, useIsFetching, queryCache } from '../index'
import { sleep } from './utils'

describe('useIsFetching', () => {
  afterEach(() => {
    queryCache.clear()
  })

  // it('should update as queries start and stop fetching', async () => {
  //   await act(() => sleep(100))
  // })

  // return

  // See https://github.com/tannerlinsley/react-query/issues/105
  it('should update as queries start and stop fetching', async () => {
    function Page() {
      const [ready, setReady] = React.useState(false)

      const isFetching = useIsFetching()

      useQuery(
        'test',
        async () => {
          await sleep(1000)
          return 'test'
        },
        {
          enabled: ready,
        }
      )

      return (
        <div>
          {/* <div>isFetching: {isFetching}</div> */}
          <button onClick={() => setReady(true)}>setReady</button>
        </div>
      )
    }

    const rendered = render(<Page />)

    // await waitFor(() => rendered.getByText('isFetching: 0'))
    // fireEvent.click(rendered.getByText('setReady'))
    // await waitFor(() => rendered.getByText('isFetching: 1'))
    // await waitFor(() => rendered.getByText('isFetching: 0'))
  })
})
