import { QueryClient } from '@tanstack/query-core'
import { fireEvent, render } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Base from './Base.svelte'

describe('useIsFetching', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should update as queries start and stop fetching', async () => {
    const rendered = render(Base, {
      props: { queryClient },
    })

    expect(rendered.getByText('isFetching: 0')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /setReady/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('isFetching: 1')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('isFetching: 0')).toBeInTheDocument()
  })
})
