import { render } from '@testing-library/react'
import React from 'react'
import { ReactQueryDevtools } from '../'

import { QueryClient, QueryClientProvider } from '../..'

export function renderWithClient(
  client: QueryClient,
  ui: React.ReactElement,
  devtoolsOptions?: Parameters<typeof ReactQueryDevtools>[number]
) {
  const { rerender, ...result } = render(
    <QueryClientProvider client={client}>
      <ReactQueryDevtools initialIsOpen={false} {...devtoolsOptions} />
      {ui}
    </QueryClientProvider>
  )
  return {
    ...result,
    rerender: (rerenderUi: React.ReactElement) =>
      rerender(
        <QueryClientProvider client={client}>
          <ReactQueryDevtools {...devtoolsOptions} />
          {rerenderUi}
        </QueryClientProvider>
      ),
  }
}

export function sleep(timeout: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, timeout)
  })
}
