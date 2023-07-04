import { describe, expect, test } from 'vitest'
import { render, waitFor } from '@testing-library/svelte'
import { derived, writable } from 'svelte/store'
import CreateQuery from './CreateQuery.svelte'
import { sleep } from './utils'
import type { CreateQueryOptions } from '../types'

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
      },
    })

    await waitFor(() => {
      expect(rendered.getByText('Loading')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(rendered.getByText('Success')).toBeInTheDocument()
    })
  })

  test('Keep previous data when returned as placeholder data', async () => {
    const options = writable({
      queryKey: ['test', [1]],
      queryFn: async ({ queryKey }) => {
        await sleep(10)
        const ids = queryKey[1]
        if (!ids || !Array.isArray(ids)) return []
        return ids.map((id) => ({ id }))
      },
      placeholderData: (previousData: { id: number }[]) => previousData,
    }) satisfies CreateQueryOptions
  
    const rendered = render(CreateQuery, { props: { options } })

    await waitFor(() => {
      expect(rendered.queryByText('id: 1')).not.toBeInTheDocument()
      expect(rendered.queryByText('id: 2')).not.toBeInTheDocument()
    })

    await waitFor(() => {
      expect(rendered.queryByText('id: 1')).toBeInTheDocument()
      expect(rendered.queryByText('id: 2')).not.toBeInTheDocument()
    })

    options.update((o) => ({ ...o, queryKey: ['test', [1, 2]] }))

    await waitFor(() => {
      expect(rendered.queryByText('id: 1')).toBeInTheDocument()
      expect(rendered.queryByText('id: 2')).not.toBeInTheDocument()
    })

    await waitFor(() => {
      expect(rendered.queryByText('id: 1')).toBeInTheDocument()
      expect(rendered.queryByText('id: 2')).toBeInTheDocument()
    })
  })

  test('Accept a writable store for options', async () => {
    const optionsStore = writable({
      queryKey: ['test'],
      queryFn: async () => {
        await sleep(10)
        return 'Success'
      },
    }) satisfies CreateQueryOptions
    
    const rendered = render(CreateQuery, {
      props: {
        options: optionsStore,
      }
    })

    await waitFor(() => {
      expect(rendered.getByText('Success')).toBeInTheDocument()
    })
  })

  test('Accept a derived store for options', async () => {
    const writableStore = writable("test");

    const derivedStore = derived(writableStore, ($store) => ({
      queryKey: [$store],
      queryFn: async () => {
        await sleep(10)
        return 'Success'
      },
    })) satisfies CreateQueryOptions
    
    const rendered = render(CreateQuery, {
      props: {
        options: derivedStore,
      }
    })

    await waitFor(() => {
      expect(rendered.getByText('Success')).toBeInTheDocument()
    })
  })
})
