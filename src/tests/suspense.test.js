import { render, waitForElement, cleanup } from '@testing-library/react'
import * as React from 'react'

import { useQuery, queryCache } from '../index'
import { sleep } from './utils'

describe("useQuery's in Suspense mode", () => {
  afterEach(() => {
    queryCache.clear()
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
      <React.Suspense fallback="loading">
        <Page />
      </React.Suspense>
    )

    await waitForElement(() => rendered.getByText('rendered'))

    expect(queryFn).toHaveBeenCalledTimes(1)
  })
})
