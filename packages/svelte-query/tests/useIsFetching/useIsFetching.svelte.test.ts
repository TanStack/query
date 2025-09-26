import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/svelte'
import BaseExample from './BaseExample.svelte'

describe('useIsFetching', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('should update as queries start and stop fetching', async () => {
    const rendered = render(BaseExample)

    expect(rendered.getByText('isFetching: 0')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /setReady/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('isFetching: 1')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('isFetching: 0')).toBeInTheDocument()
  })
})
