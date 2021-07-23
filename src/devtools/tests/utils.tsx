import { render } from '@testing-library/react'
import React from 'react'
import { ReactQueryDevtools } from '../'

import { QueryClient, QueryClientProvider, QueryCache } from '../..'

export function renderWithClient(
  client: QueryClient,
  ui: React.ReactElement,
  devtoolsOptions?: Parameters<typeof ReactQueryDevtools>[number]
) {
  const { rerender, ...result } = render(
    <QueryClientProvider client={client}>
      <ReactQueryDevtools {...devtoolsOptions} />
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

/**
 * This method is useful for matching by text content when the text is splitted
 * across different HTML elements which cannot be searched by normal
 * *ByText methods. It returns a function that can be passed to the testing
 * library's *ByText methods.
 * @param textToMatch The string that needs to be matched
 * @reference https://stackoverflow.com/a/56859650/8252081
 */
export const getByTextContent = (textToMatch: string) => (
  _content: string,
  node: HTMLElement
): boolean => {
  const hasText = (currentNode: HTMLElement) =>
    currentNode.textContent === textToMatch
  const nodeHasText = hasText(node)
  const childrenDontHaveText = Array.from(node.children).every(
    child => !hasText(child as HTMLElement)
  )

  return nodeHasText && childrenDontHaveText
}

interface CreateQueryClientResponse {
  queryClient: QueryClient
  queryCache: QueryCache
}

export const createQueryClient = (): CreateQueryClientResponse => {
  const queryCache = new QueryCache()
  const queryClient = new QueryClient({
    queryCache,
    defaultOptions: {
      queries: {
        staleTime: 0,
      },
    },
  })
  return { queryClient, queryCache }
}
