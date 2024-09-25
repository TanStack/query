/* istanbul ignore file */
import { QueryClient } from '@tanstack/query-core'
import type { DefaultOptions } from '@tanstack/query-core'

/**
 * Set up query client with default options for testing
 * @param options to combine with default options for query client
 * @link [Testing Docs](https://tanstack.com/query/latest/docs/framework/react/guides/testing).
 */
export const createQueryClient = (options: DefaultOptions<Error> = {}) => {
  const { queries, ...rest } = options
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // disable retries to avoid test timeout
        gcTime: Infinity, // disable cache to avoid test timeout
        ...queries,
      },
    },
    ...rest,
  })

  queryClient.clear()
  return queryClient
}

export type WithMaybeShadowRoot = { readonly shadowRoot: ShadowRoot | null }
/**
 * Retrieve the first child element that matches a given selector within a root element.
 * @param selector - CSS selector to match the child elements.
 * @param root - Root element or shadow root to search within.
 * @returns The first element that matches the selector.
 * @throws Will throw an error if no matching element is found.
 */
export function getNodeFor(
  selector: string,
  host?: WithMaybeShadowRoot,
): Element {
  const element = (host?.shadowRoot ?? document).querySelector(selector)
  if (!element) {
    throw new Error(`Element with selector "${selector}" not found`)
  }
  return element
}
