import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/svelte'
import { getIsRestoringContext } from '../../src/index.js'
import Base from './Base.svelte'

describe('getQueryClientContext', () => {
  it('should throw when called without a client in context', () => {
    expect(() => render(Base)).toThrow(
      'No QueryClient was found in Svelte context. Did you forget to wrap your component with QueryClientProvider?',
    )
  })
})

describe('getIsRestoringContext', () => {
  it('should not throw when called outside of a component', () => {
    expect(() => getIsRestoringContext()).not.toThrow()
  })
})
