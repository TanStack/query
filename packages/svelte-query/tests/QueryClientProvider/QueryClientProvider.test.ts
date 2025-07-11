import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { render } from '@testing-library/svelte'
import { QueryCache } from '@tanstack/query-core'
import ParentComponent from './ParentComponent.svelte'

describe('QueryClientProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('Sets a specific cache for all queries to use', async () => {
    const queryCache = new QueryCache()

    const rendered = render(ParentComponent, {
      props: {
        queryCache: queryCache,
      },
    })

    await vi.waitFor(() =>
      expect(rendered.getByText('Data: test')).toBeInTheDocument(),
    )

    expect(queryCache.find({ queryKey: ['hello'] })).toBeDefined()
  })
})
