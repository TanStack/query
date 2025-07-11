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
      expect(rendered.getByText('isMutating: 0')).toBeInTheDocument(),
    )
    fireEvent.click(rendered.getByRole('button', { name: /Trigger/i }))
    await vi.waitFor(() =>
      expect(rendered.getByText('isMutating: 1')).toBeInTheDocument(),
    )
    await vi.waitFor(() =>
      expect(rendered.getByText('isMutating: 0')).toBeInTheDocument(),
    )
  })
})
