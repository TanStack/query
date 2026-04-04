import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/svelte'
import { QueryClient } from '@tanstack/query-core'
import { sleep } from '@tanstack/query-test-utils'
import IsRestoringExample from './IsRestoringExample.svelte'

describe('createQueries (isRestoring)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should not fetch for the duration of the restoring period when isRestoring is true', async () => {
    const queryClient = new QueryClient()
    const queryFn1 = vi.fn(() => sleep(10).then(() => 'data1'))
    const queryFn2 = vi.fn(() => sleep(10).then(() => 'data2'))

    const rendered = render(IsRestoringExample, {
      props: { queryClient, queryFn1, queryFn2 },
    })

    await vi.advanceTimersByTimeAsync(0)

    expect(rendered.getByTestId('status1')).toHaveTextContent('pending')
    expect(rendered.getByTestId('status2')).toHaveTextContent('pending')
    expect(rendered.getByTestId('fetchStatus1')).toHaveTextContent('idle')
    expect(rendered.getByTestId('fetchStatus2')).toHaveTextContent('idle')
    expect(rendered.getByTestId('data1')).toHaveTextContent('undefined')
    expect(rendered.getByTestId('data2')).toHaveTextContent('undefined')
    expect(queryFn1).toHaveBeenCalledTimes(0)
    expect(queryFn2).toHaveBeenCalledTimes(0)

    await vi.advanceTimersByTimeAsync(11)

    expect(rendered.getByTestId('status1')).toHaveTextContent('pending')
    expect(rendered.getByTestId('status2')).toHaveTextContent('pending')
    expect(rendered.getByTestId('fetchStatus1')).toHaveTextContent('idle')
    expect(rendered.getByTestId('fetchStatus2')).toHaveTextContent('idle')
    expect(rendered.getByTestId('data1')).toHaveTextContent('undefined')
    expect(rendered.getByTestId('data2')).toHaveTextContent('undefined')
    expect(queryFn1).toHaveBeenCalledTimes(0)
    expect(queryFn2).toHaveBeenCalledTimes(0)
  })
})
