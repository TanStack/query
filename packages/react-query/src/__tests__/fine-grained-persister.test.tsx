import { describe, expect, it, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import * as React from 'react'
import { QueryCache, hashKey } from '@tanstack/query-core'
import {
  PERSISTER_KEY_PREFIX,
  experimental_createPersister,
} from '@tanstack/query-persist-client-core'
import { useQuery } from '..'
import { createQueryClient, queryKey, renderWithClient, sleep } from './utils'

describe('fine grained persister', () => {
  const queryCache = new QueryCache()
  const queryClient = createQueryClient({ queryCache })

  it('should restore query state from persister and not refetch', async () => {
    const key = queryKey()
    const hash = hashKey(key)
    const spy = vi.fn(() => Promise.resolve('Works from queryFn'))

    const mapStorage = new Map()
    const storage = {
      getItem: (itemKey: string) => Promise.resolve(mapStorage.get(itemKey)),
      setItem: async (itemKey: string, value: unknown) => {
        mapStorage.set(itemKey, value)
      },
      removeItem: async (itemKey: string) => {
        mapStorage.delete(itemKey)
      },
    }

    await storage.setItem(
      `${PERSISTER_KEY_PREFIX}-${hash}`,
      JSON.stringify({
        buster: '',
        queryHash: hash,
        queryKey: key,
        state: {
          dataUpdatedAt: Date.now(),
          data: 'Works from persister',
        },
      }),
    )

    function Test() {
      const [_, setRef] = React.useState<HTMLDivElement | null>()

      const { data } = useQuery({
        queryKey: key,
        queryFn: spy,
        persister: experimental_createPersister({
          storage,
        }),
        staleTime: 5000,
      })

      return <div ref={(value) => setRef(value)}>{data}</div>
    }

    const rendered = renderWithClient(queryClient, <Test />)

    await waitFor(() => rendered.getByText('Works from persister'))
    expect(spy).not.toHaveBeenCalled()
  })

  it('should restore query state from persister and refetch', async () => {
    const key = queryKey()
    const hash = hashKey(key)
    const spy = vi.fn(async () => {
      await sleep(5)

      return 'Works from queryFn'
    })

    const mapStorage = new Map()
    const storage = {
      getItem: (itemKey: string) => Promise.resolve(mapStorage.get(itemKey)),
      setItem: async (itemKey: string, value: unknown) => {
        mapStorage.set(itemKey, value)
      },
      removeItem: async (itemKey: string) => {
        mapStorage.delete(itemKey)
      },
    }

    await storage.setItem(
      `${PERSISTER_KEY_PREFIX}-${hash}`,
      JSON.stringify({
        buster: '',
        queryHash: hash,
        queryKey: key,
        state: {
          dataUpdatedAt: Date.now(),
          data: 'Works from persister',
        },
      }),
    )

    function Test() {
      const [_, setRef] = React.useState<HTMLDivElement | null>()

      const { data } = useQuery({
        queryKey: key,
        queryFn: spy,
        persister: experimental_createPersister({
          storage,
        }),
      })

      return <div ref={(value) => setRef(value)}>{data}</div>
    }

    const rendered = renderWithClient(queryClient, <Test />)

    await waitFor(() => rendered.getByText('Works from persister'))
    await waitFor(() => rendered.getByText('Works from queryFn'))
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('should store query state to persister after fetch', async () => {
    const key = queryKey()
    const hash = hashKey(key)
    const spy = vi.fn(() => Promise.resolve('Works from queryFn'))

    const mapStorage = new Map()
    const storage = {
      getItem: (itemKey: string) => Promise.resolve(mapStorage.get(itemKey)),
      setItem: async (itemKey: string, value: unknown) => {
        mapStorage.set(itemKey, value)
      },
      removeItem: async (itemKey: string) => {
        mapStorage.delete(itemKey)
      },
    }

    function Test() {
      const [_, setRef] = React.useState<HTMLDivElement | null>()

      const { data } = useQuery({
        queryKey: key,
        queryFn: spy,
        persister: experimental_createPersister({
          storage,
        }),
      })

      return <div ref={(value) => setRef(value)}>{data}</div>
    }

    const rendered = renderWithClient(queryClient, <Test />)

    await waitFor(() => rendered.getByText('Works from queryFn'))
    expect(spy).toHaveBeenCalledTimes(1)

    const storedItem = await storage.getItem(`${PERSISTER_KEY_PREFIX}-${hash}`)
    expect(JSON.parse(storedItem)).toMatchObject({
      state: {
        data: 'Works from queryFn',
      },
    })
  })
})
