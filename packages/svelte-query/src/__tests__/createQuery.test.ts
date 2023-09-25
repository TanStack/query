import { describe, expect, test } from 'vitest'
import { render, waitFor } from '@testing-library/svelte'
import { derived, writable } from 'svelte/store'
import { QueryClient } from '@tanstack/query-core'
import CreateQuery from './CreateQuery.svelte'
import { sleep } from './utils'

describe('createQuery', () => {
  test('Render and wait for success', async () => {
    const rendered = render(CreateQuery, {
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
    const optionsStore = writable({
      queryKey: ['test'],
      queryFn: async () => {
        await sleep(10)
        return 'Success'
      },
    })

    const rendered = render(CreateQuery, {
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
    const writableStore = writable('test')

    const derivedStore = derived(writableStore, ($store) => ({
      queryKey: [$store],
      queryFn: async () => {
        await sleep(10)
        return 'Success'
      },
    }))

    const rendered = render(CreateQuery, {
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
    const writableStore = writable(1)

    const derivedStore = derived(writableStore, ($store) => ({
      queryKey: [$store],
      queryFn: async () => {
        await sleep(10)
        return `Success ${$store}`
      },
    }))

    const rendered = render(CreateQuery, {
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

    writableStore.set(2)

    await waitFor(() => {
      expect(rendered.queryByText('Success 1')).not.toBeInTheDocument()
      expect(rendered.queryByText('Success 2')).toBeInTheDocument()
    })

    writableStore.set(1)

    await waitFor(() => {
      expect(rendered.queryByText('Success 1')).toBeInTheDocument()
      expect(rendered.queryByText('Success 2')).not.toBeInTheDocument()
    })
  })

  test('Keep previous data when returned as placeholder data', async () => {
    const writableStore = writable<Array<number>>([1])

    const derivedStore = derived(writableStore, ($store) => ({
      queryKey: ['test', $store],
      queryFn: async () => {
        await sleep(10)
        return $store.map((id) => `Success ${id}`)
      },
      placeholderData: (previousData: string) => previousData,
    }))

    const rendered = render(CreateQuery, {
      props: {
        options: derivedStore,
        queryClient: new QueryClient(),
      },
    })

    await waitFor(() => {
      expect(rendered.queryByText('Success 1')).not.toBeInTheDocument()
      expect(rendered.queryByText('Success 2')).not.toBeInTheDocument()
    })

    await waitFor(() => {
      expect(rendered.queryByText('Success 1')).toBeInTheDocument()
      expect(rendered.queryByText('Success 2')).not.toBeInTheDocument()
    })

    writableStore.set([1, 2])

    await waitFor(() => {
      expect(rendered.queryByText('Success 1')).toBeInTheDocument()
      expect(rendered.queryByText('Success 2')).not.toBeInTheDocument()
    })

    await waitFor(() => {
      expect(rendered.queryByText('Success 1')).toBeInTheDocument()
      expect(rendered.queryByText('Success 2')).toBeInTheDocument()
    })
  })
})
