import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/svelte'
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

    await vi.waitFor(() =>
      expect(rendered.getByText('isFetching: 0')).toBeInTheDocument(),
    )
    fireEvent.click(rendered.getByRole('button', { name: /setReady/i }))
    await vi.waitFor(() =>
      expect(rendered.getByText('isFetching: 1')).toBeInTheDocument(),
    )
    await vi.waitFor(() =>
      expect(rendered.getByText('isFetching: 0')).toBeInTheDocument(),
    )
  })
})
