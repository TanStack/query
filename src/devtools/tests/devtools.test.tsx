import React from 'react'
import { fireEvent, screen, waitForElementToBeRemoved } from '@testing-library/react'
import { QueryClient, QueryCache, useQuery } from '../..'
import { renderWithClient, sleep } from './utils'

describe('ReactQueryDevtools', () => {
  const queryCache = new QueryCache()
  const queryClient = new QueryClient({ queryCache })

  it('should be able to open and close devtools', async () => {
    function Page() {
      const { data = 'default' } = useQuery('check', async () => {
        await sleep(10)
        return 'test'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    renderWithClient(queryClient, <Page />)

    console.log(queryCache.find('check')?.isFetching())

    // Since the initial is open state is false, expect the close button to not be present
    // in the DOM. Then find the open button and click on it.
    const closeButton = screen.queryByRole('button', { name: /close react query devtools/i })
    expect(closeButton).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /open react query devtools/i }))

    // Wait for the animation to finish and the open button to be removed from DOM once the devtools
    // is opened. Then find the close button and click on it.
    await waitForElementToBeRemoved(() => screen.queryByRole('button', { name: /open react query devtools/i }))
    fireEvent.click(screen.getByRole('button', { name: /close react query devtools/i }))

    // Finally once the close animation is completed expect the open button to
    // be present in the DOM again.
    await screen.findByRole('button', { name: /open react query devtools/i })
  })
})

export {}
