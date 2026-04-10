import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/svelte'
import { sleep } from '@tanstack/query-test-utils'
import IsRestoringExample from './IsRestoringExample.svelte'

describe('createQuery', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should not fetch for the duration of the restoring period when isRestoring is true', async () => {
    const queryFn = vi.fn(() => sleep(10).then(() => 'data'))

    const rendered = render(IsRestoringExample, {
      props: { queryFn },
    })

    await vi.advanceTimersByTimeAsync(0)

    expect(rendered.getByTestId('status')).toHaveTextContent('pending')
    expect(rendered.getByTestId('fetchStatus')).toHaveTextContent('idle')
    expect(rendered.getByTestId('data')).toHaveTextContent('undefined')
    expect(queryFn).toHaveBeenCalledTimes(0)

    await vi.advanceTimersByTimeAsync(11)

    expect(rendered.getByTestId('status')).toHaveTextContent('pending')
    expect(rendered.getByTestId('fetchStatus')).toHaveTextContent('idle')
    expect(rendered.getByTestId('data')).toHaveTextContent('undefined')
    expect(queryFn).toHaveBeenCalledTimes(0)
  })
})
