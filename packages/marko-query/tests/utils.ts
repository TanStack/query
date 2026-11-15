import { expect } from 'vitest'
import { QueryClient } from '@tanstack/marko-query'

export function createClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
}

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * Waits until the element's text matches, then asserts. Core notifies in
 * batches and Marko applies DOM updates on its own schedule, so a fixed
 * sleep races in both directions; polling the DOM does not.
 */
export async function expectText(
  root: ParentNode,
  id: string,
  expected: string,
): Promise<void> {
  await expect
    .poll(() => text(root, id), { timeout: 2_000, interval: 10 })
    .toBe(expected)
}

export function container(): HTMLElement {
  const element = document.createElement('div')
  document.body.append(element)
  return element
}

export const text = (root: ParentNode, id: string) =>
  root.querySelector(`#${id}`)?.textContent
