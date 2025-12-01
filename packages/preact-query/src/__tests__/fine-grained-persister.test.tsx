import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import {
  PERSISTER_KEY_PREFIX,
  experimental_createQueryPersister,
} from '@tanstack/query-persist-client-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { QueryCache, QueryClient, hashKey, useQuery } from '..'
import { renderWithClient } from './utils'

describe('fine grained persister', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const queryCache = new QueryCache()
  const queryClient = new QueryClient({ queryCache })

  it('should restore query state from persister and not refetch', async () => {
    const key = queryKey()
    const hash = hashKey(key)
    const spy = vi.fn(() => Promise.resolve('Works from queryFn'))

    const mapStorage = new Map()
    const storage = {
      getItem: (itemKey: string) => Promise.resolve(mapStorage.get(itemKey)),
      setItem: (itemKey: string, value: unknown) => {
        mapStorage.set(itemKey, value)
        return Promise.resolve()
      },
      removeItem: (itemKey: string) => {
        mapStorage.delete(itemKey)
        return Promise.resolve()
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
        persister: experimental_createQueryPersister({
          storage,
        }).persisterFn,
        staleTime: 5000,
      })

      return <div ref={(value) => setRef(value)}>{data}</div>
    }

    const rendered = renderWithClient(queryClient, <Test />)

    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('Works from persister')).toBeInTheDocument()
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
      setItem: (itemKey: string, value: unknown) => {
        mapStorage.set(itemKey, value)
        return Promise.resolve()
      },
      removeItem: (itemKey: string) => {
        mapStorage.delete(itemKey)
        return Promise.resolve()
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
        persister: experimental_createQueryPersister({
          storage,
        }).persisterFn,
      })

      return <div ref={(value) => setRef(value)}>{data}</div>
    }

    const rendered = renderWithClient(queryClient, <Test />)

    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('Works from persister')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(6)
    expect(rendered.getByText('Works from queryFn')).toBeInTheDocument()
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('should store query state to persister after fetch', async () => {
    const key = queryKey()
    const hash = hashKey(key)
    const spy = vi.fn(() => Promise.resolve('Works from queryFn'))

    const mapStorage = new Map()
    const storage = {
      getItem: (itemKey: string) => Promise.resolve(mapStorage.get(itemKey)),
      setItem: (itemKey: string, value: unknown) => {
        mapStorage.set(itemKey, value)
        return Promise.resolve()
      },
      removeItem: (itemKey: string) => {
        mapStorage.delete(itemKey)
        return Promise.resolve()
      },
    }

    function Test() {
      const [_, setRef] = React.useState<HTMLDivElement | null>()

      const { data } = useQuery({
        queryKey: key,
        queryFn: spy,
        persister: experimental_createQueryPersister({
          storage,
        }).persisterFn,
      })

      return <div ref={(value) => setRef(value)}>{data}</div>
    }

    const rendered = renderWithClient(queryClient, <Test />)

    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('Works from queryFn')).toBeInTheDocument()
    expect(spy).toHaveBeenCalledTimes(1)

    const storedItem = await storage.getItem(`${PERSISTER_KEY_PREFIX}-${hash}`)
    expect(JSON.parse(storedItem)).toMatchObject({
      state: {
        data: 'Works from queryFn',
      },
    })
  })
})
