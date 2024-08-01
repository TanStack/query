import { describe, expect, test } from 'vitest'
import { render } from '@testing-library/svelte'
import { getIsRestoringContext } from '../../src/index.js'
import BaseExample from './BaseExample.svelte'

describe('getQueryClientContext', () => {
  test('Throw when called without a client in context', () => {
    expect(() => render(BaseExample)).toThrowError(
      'No QueryClient was found in Svelte context. Did you forget to wrap your component with QueryClientProvider?',
    )
  })
})

describe('getIsRestoringContext', () => {
  test('Do not throw when called outside of a component', () => {
    expect(() => getIsRestoringContext()).not.toThrowError()
  })
})
