import { describe, expect, test } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/svelte'
import { QueryClient } from '@tanstack/query-core'
import { sleep } from '../utils'
import BaseExample from './BaseExample.svelte'
import DisabledExample from './DisabledExample.svelte'

describe('createQuery', () => {
  test('Render and wait for success', async () => {
    const rendered = render(BaseExample, {
      props: {
        options: {
          queryKey: ['test'],
          queryFn: async () => {
            await sleep(10)
            return 'Success'
          },
        },
        queryClient: new QueryClient(),
      },
    })

    await waitFor(() => {
      expect(rendered.queryByText('Loading')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(rendered.queryByText('Success')).toBeInTheDocument()
    })
  })

  test('Accept a writable store for options', async () => {
    const optionsStore = {
      queryKey: ['test'],
      queryFn: async () => {
        await sleep(10)
        return 'Success'
      },
    }

    const rendered = render(BaseExample, {
      props: {
        options: optionsStore,
        queryClient: new QueryClient(),
      },
    })

    await waitFor(() => {
      expect(rendered.queryByText('Success')).toBeInTheDocument()
    })
  })

  test('Accept a derived store for options', async () => {
    const derivedStore = $state(
      ((store) => ({
        queryKey: [store],
        queryFn: async () => {
          await sleep(10)
          return 'Success'
        },
      }))(),
    )

    const rendered = render(BaseExample, {
      props: {
        options: derivedStore,
        queryClient: new QueryClient(),
      },
    })

    await waitFor(() => {
      expect(rendered.queryByText('Success')).toBeInTheDocument()
    })
  })

  test('Ensure reactivity when queryClient defaults are set', async () => {
    let writableStore = $state(1)

    const derivedStore = $derived({
      queryKey: () => [writableStore],
      queryFn: async () => {
        await sleep(50)
        return `Success ${writableStore}`
      },
    })

    const rendered = render(BaseExample, {
      props: {
        options: derivedStore,
        queryClient: new QueryClient({
          defaultOptions: { queries: { staleTime: 60 * 1000 } },
        }),
      },
    })

    await waitFor(() => {
      expect(rendered.queryByText('Success 1')).toBeInTheDocument()
      expect(rendered.queryByText('Success 2')).not.toBeInTheDocument()
    })

    writableStore = 2

    await waitFor(() => {
      expect(rendered.queryByText('Success 1')).not.toBeInTheDocument()
      expect(rendered.queryByText('Success 2')).toBeInTheDocument()
    })

    writableStore = 1

    await waitFor(() => {
      expect(rendered.queryByText('Success 1')).toBeInTheDocument()
      expect(rendered.queryByText('Success 2')).not.toBeInTheDocument()
    })
  })

  test('Keep previous data when returned as placeholder data', async () => {
    let writableStore = $state<Array<number>>([1])

    const derivedStore = $derived.by(() => ({
      queryKey: () => ['test', writableStore],
      queryFn: async () => {
        await sleep(5)
        return writableStore.map((id) => `Success ${id}`)
      },
      placeholderData: (previousData: string) => previousData,
    }))

    let rendered = render(BaseExample, {
      props: {
        options: derivedStore,
        queryClient: new QueryClient(),
      },
    })

    await waitFor(() => {
      expect(rendered.queryByText('Success 1')).toBeInTheDocument()
      expect(rendered.queryByText('Success 2')).not.toBeInTheDocument()
    })

    writableStore = [1, 2]

    await waitFor(() => {
      expect(rendered.queryByText('Success 1')).toBeInTheDocument()
      expect(rendered.queryByText('Success 2')).not.toBeInTheDocument()
    })

    await waitFor(() => {
      expect(rendered.queryByText('Success 1')).toBeInTheDocument()
      expect(rendered.queryByText('Success 2')).toBeInTheDocument()
    })
  })

  test('Should not fetch when switching to a disabled query', async () => {
    const rendered = render(DisabledExample)

    await waitFor(() => rendered.getByText('Data: undefined'))

    fireEvent.click(rendered.getByRole('button', { name: /Increment/i }))

    await waitFor(() => {
      rendered.getByText('Count: 0')
      rendered.getByText('Data: 0')
    })
  })
})
