import { render, fireEvent, waitFor } from '@testing-library/react'
import * as React from 'react'

import { useQuery, useIsFetching } from '../index'
import { sleep, queryKey } from './utils'

describe('useIsFetching', () => {
  // See https://github.com/tannerlinsley/react-query/issues/105
  it('should update as queries start and stop fetching', async () => {
    const key = queryKey()

    function Page() {
      const [ready, setReady] = React.useState(false)

      const isFetching = useIsFetching()

      useQuery(
        key,
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
          <div>isFetching: {isFetching}</div>
          <button onClick={() => setReady(true)}>setReady</button>
        </div>
      )
    }

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('isFetching: 0'))
    fireEvent.click(rendered.getByText('setReady'))
    await waitFor(() => rendered.getByText('isFetching: 1'))
    await waitFor(() => rendered.getByText('isFetching: 0'))
  })
})
