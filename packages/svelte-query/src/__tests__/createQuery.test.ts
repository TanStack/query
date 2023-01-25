import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import { writable } from 'svelte/store'
import CreateQuery from './CreateQuery.svelte'
import { sleep } from './utils'
import type { CreateQueryOptions, WritableOrVal } from '../types'

describe('createQuery', () => {
  it('Render and wait for success', async () => {
    render(CreateQuery, {
      props: {
        options: {
          queryKey: ['test'],
          queryFn: async () => {
            await sleep(100)
            return 'Success'
          },
        },
      },
    })

    expect(screen.queryByText('Loading')).toBeInTheDocument()
    expect(screen.queryByText('Error')).not.toBeInTheDocument()
    expect(screen.queryByText('Success')).not.toBeInTheDocument()

    await sleep(200)

    expect(screen.queryByText('Success')).toBeInTheDocument()
    expect(screen.queryByText('Loading')).not.toBeInTheDocument()
    expect(screen.queryByText('Error')).not.toBeInTheDocument()
  })

  it('should keep previous data with keepPreviousData option set to true', async () => {
    const options: WritableOrVal<CreateQueryOptions> = writable({
      queryKey: ['test', [1]],
      queryFn: async ({ queryKey }) => {
        await sleep(100)
        const ids = queryKey[1]
        if (!ids || !Array.isArray(ids)) return []
        return ids.map((id) => ({ id }))
      },
      keepPreviousData: true,
    })
    render(CreateQuery, { props: { options } })

    expect(screen.queryByText('id: 1')).not.toBeInTheDocument()
    expect(screen.queryByText('id: 2')).not.toBeInTheDocument()

    await sleep(200)

    expect(screen.queryByText('id: 1')).toBeInTheDocument()
    expect(screen.queryByText('id: 2')).not.toBeInTheDocument()

    options.update((o) => ({ ...o, queryKey: ['test', [1, 2]] }))

    await sleep(0)

    expect(screen.queryByText('id: 1')).toBeInTheDocument()
    expect(screen.queryByText('id: 2')).not.toBeInTheDocument()

    await sleep(200)

    expect(screen.queryByText('id: 1')).toBeInTheDocument()
    expect(screen.queryByText('id: 2')).toBeInTheDocument()
  })
})
