import React from 'react'

import { queryKey, renderWithClient } from './utils'
import { useQuery, useIsError, QueryClient } from '../..'

describe('useIsError', () => {
  xit('should return number of errored queries', async () => {
    const queryClient = new QueryClient()

    const key1 = queryKey()

    function Page() {
      const { status } = useQuery(key1, async () => {
        throw new Error()
      })
      // for some reason, query never goes into error state
      console.log(status)

      const errorCount = useIsError()

      return (
        <>
          <div data-testid="errorCount">{errorCount}</div>
        </>
      )
    }

    const { findByTestId } = renderWithClient(queryClient, <Page />)
    const errorCount = await findByTestId('errorCount')
    expect(errorCount.textContent).toBe('1')
  })
})
