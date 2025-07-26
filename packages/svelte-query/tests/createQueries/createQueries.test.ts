import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { render } from '@testing-library/svelte'
import { QueryClient } from '@tanstack/query-core'
import { sleep } from '@tanstack/query-test-utils'
import BaseExample from './BaseExample.svelte'
import CombineExample from './CombineExample.svelte'

describe('createQueries', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('Render and wait for success', async () => {
    const rendered = render(BaseExample, {
      props: {
        options: {
          queries: [
            {
              queryKey: ['key-1'],
              queryFn: () => sleep(10).then(() => 'Success 1'),
            },
            {
              queryKey: ['key-2'],
              queryFn: () => sleep(10).then(() => 'Success 2'),
            },
          ],
        },
        queryClient: new QueryClient(),
      },
    })

    expect(rendered.getByText('Status 1: pending')).toBeInTheDocument()
    expect(rendered.getByText('Status 2: pending')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('Status 1: success')).toBeInTheDocument()
    expect(rendered.getByText('Status 2: success')).toBeInTheDocument()
  })

  test('Render and wait for success when queries resolve at different times', async () => {
    const rendered = render(BaseExample, {
      props: {
        options: {
          queries: [
            {
              queryKey: ['key-1'],
              queryFn: () => sleep(10).then(() => 'Success 1'),
            },
            {
              queryKey: ['key-2'],
              queryFn: () => sleep(20).then(() => 'Success 2'),
            },
          ],
        },
        queryClient: new QueryClient(),
      },
    })

    expect(rendered.getByText('Status 1: pending')).toBeInTheDocument()
    expect(rendered.getByText('Status 2: pending')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('Status 1: success')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('Status 2: success')).toBeInTheDocument()
  })

  test('Combine queries', async () => {
    const rendered = render(CombineExample, {
      props: {
        queryClient: new QueryClient(),
      },
    })

    expect(rendered.getByText('isPending: true')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('Data: 1,2,3')).toBeInTheDocument()
  })
})
