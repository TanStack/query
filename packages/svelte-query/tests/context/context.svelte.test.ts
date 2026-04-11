import { describe, expect, test } from 'vitest'
import { render } from '@testing-library/svelte'
import { getIsRestoringContext } from '../../src/index.js'
import BaseExample from './BaseExample.svelte'

describe('getQueryClientContext', () => {
  test('should throw when called without a client in context', () => {
    expect(() => render(BaseExample)).toThrow(
      'No QueryClient was found in Svelte context. Did you forget to wrap your component with QueryClientProvider?',
    )
  })
})

describe('getIsRestoringContext', () => {
  test('should not throw when called outside of a component', () => {
    expect(() => getIsRestoringContext()).not.toThrow()
  })
})
