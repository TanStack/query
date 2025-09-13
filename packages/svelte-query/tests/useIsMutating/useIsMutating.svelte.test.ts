import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/svelte'
import BaseExample from './BaseExample.svelte'

describe('useIsMutating', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('should update as queries start and stop mutating', async () => {
    const rendered = render(BaseExample)

    expect(rendered.getByText('isMutating: 0')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /Trigger/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('isMutating: 1')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('isMutating: 0')).toBeInTheDocument()
  })
})
