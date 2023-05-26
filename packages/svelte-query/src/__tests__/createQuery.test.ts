import { describe, it, expect } from 'vitest'
import { render, waitFor } from '@testing-library/svelte'
import { writable } from 'svelte/store'
import CreateQuery from './CreateQuery.svelte'
import { sleep } from './utils'
import type { CreateQueryOptions } from '../types'

describe('createQuery', () => {
  it('Render and wait for success', async () => {
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

  it('should keep previous data when returned as placeholder data', async () => {
    const options: CreateQueryOptions = writable({
      queryKey: ['test', [1]],
      queryFn: async ({ queryKey }) => {
        await sleep(10)
        const ids = queryKey[1]
        if (!ids || !Array.isArray(ids)) return []
        return ids.map((id) => ({ id }))
      },
      placeholderData: (previousData: { id: number }[]) => previousData,
    })
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
})
