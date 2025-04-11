import { describe, expect, test, vi } from 'vitest'
import {
  QueryClient,
  injectQuery,
  provideTanStackQuery,
} from '@tanstack/angular-query-experimental'
import { persistQueryClientSave } from '@tanstack/query-persist-client-core'
import {
  Component,
  effect,
  provideExperimentalZonelessChangeDetection,
} from '@angular/core'
import { render, screen, waitFor } from '@testing-library/angular'
import { withPersistQueryClient } from '../with-persist-query-client'
import { queryKey, sleep } from './utils'
import type {
  PersistedClient,
  Persister,
} from '@tanstack/query-persist-client-core'

const createMockPersister = (): Persister => {
  let storedState: PersistedClient | undefined

  return {
    persistClient(persistClient: PersistedClient) {
      storedState = persistClient
    },
    async restoreClient() {
      await sleep(10)
      return storedState
    },
    removeClient() {
      storedState = undefined
    },
  }
}

const createMockErrorPersister = (
  removeClient: Persister['removeClient'],
): [Error, Persister] => {
  const error = new Error('restore failed')
  return [
    error,
    {
      async persistClient() {
        // noop
      },
      async restoreClient() {
        await sleep(10)
        throw error
      },
      removeClient,
    },
  ]
}

describe('withPersistQueryClient', () => {
  test('restores cache from persister', async () => {
    const key = queryKey()
    const states: Array<{
      status: string
      fetchStatus: string
      data: string | undefined
    }> = []

    const queryClient = new QueryClient()
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => Promise.resolve('hydrated'),
    })

    const persister = createMockPersister()

    await persistQueryClientSave({ queryClient, persister })

    queryClient.clear()

    @Component({
      template: `
        <div>
          <h1>{{ state.data() }}</h1>
          <h2>fetchStatus: {{ state.fetchStatus() }}</h2>
        </div>
      `,
    })
    class Page {
      state = injectQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return 'fetched'
        },
      }))
      _ = effect(() => {
        states.push({
          status: this.state.status(),
          fetchStatus: this.state.fetchStatus(),
          data: this.state.data(),
        })
      })
    }

    render(Page, {
      providers: [
        provideExperimentalZonelessChangeDetection(),
        provideTanStackQuery(
          queryClient,
          withPersistQueryClient([{ persistOptions: { persister } }]),
        ),
      ],
    })

    await waitFor(() => screen.getByText('fetchStatus: idle'))
    await waitFor(() => screen.getByText('hydrated'))
    await waitFor(() => screen.getByText('fetched'))

    expect(states).toHaveLength(3)

    expect(states[0]).toMatchObject({
      status: 'pending',
      fetchStatus: 'idle',
      data: undefined,
    })

    expect(states[1]).toMatchObject({
      status: 'success',
      fetchStatus: 'fetching',
      data: 'hydrated',
    })

    expect(states[2]).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: 'fetched',
    })
  })

  test.todo(
    '(Write this test after injectQueries is working) should also put injectQueries into idle state',
  )

  test('should show initialData while restoring', async () => {
    const key = queryKey()
    const states: Array<{
      status: string
      fetchStatus: string
      data: string | undefined
    }> = []

    const queryClient = new QueryClient()
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => Promise.resolve('hydrated'),
    })

    const persister = createMockPersister()

    await persistQueryClientSave({ queryClient, persister })

    queryClient.clear()

    @Component({
      template: `
        <div>
          <h1>{{ state.data() }}</h1>
          <h2>fetchStatus: {{ state.fetchStatus() }}</h2>
        </div>
      `,
    })
    class Page {
      state = injectQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return 'fetched'
        },
        initialData: 'initial',
        // make sure that initial data is older than the hydration data
        // otherwise initialData would be newer and takes precedence
        initialDataUpdatedAt: 1,
      }))
      _ = effect(() => {
        states.push({
          status: this.state.status(),
          fetchStatus: this.state.fetchStatus(),
          data: this.state.data(),
        })
      })
    }

    render(Page, {
      providers: [
        provideExperimentalZonelessChangeDetection(),
        provideTanStackQuery(
          queryClient,
          withPersistQueryClient([{ persistOptions: { persister } }]),
        ),
      ],
    })

    await waitFor(() => screen.getByText('fetched'))

    expect(states).toHaveLength(3)

    expect(states[0]).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: 'initial',
    })

    expect(states[1]).toMatchObject({
      status: 'success',
      fetchStatus: 'fetching',
      data: 'hydrated',
    })

    expect(states[2]).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: 'fetched',
    })
  })

  test('should not refetch after restoring when data is fresh', async () => {
    const key = queryKey()
    const states: Array<{
      status: string
      fetchStatus: string
      data: string | undefined
    }> = []

    const queryClient = new QueryClient()
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => Promise.resolve('hydrated'),
    })

    const persister = createMockPersister()

    await persistQueryClientSave({ queryClient, persister })

    queryClient.clear()

    let fetched = false

    @Component({
      template: `
        <div>
          <h1>data: {{ state.data() ?? 'null' }}</h1>
          <h2>fetchStatus: {{ state.fetchStatus() }}</h2>
        </div>
      `,
    })
    class Page {
      state = injectQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          fetched = true
          await sleep(10)
          return 'fetched'
        },
        staleTime: Infinity,
      }))
      _ = effect(() => {
        states.push({
          status: this.state.status(),
          fetchStatus: this.state.fetchStatus(),
          data: this.state.data(),
        })
      })
    }

    render(Page, {
      providers: [
        provideExperimentalZonelessChangeDetection(),
        provideTanStackQuery(
          queryClient,
          withPersistQueryClient([{ persistOptions: { persister } }]),
        ),
      ],
    })

    await waitFor(() => screen.getByText('data: null'))
    await waitFor(() => screen.getByText('data: hydrated'))

    expect(states).toHaveLength(2)

    expect(fetched).toBe(false)

    expect(states[0]).toMatchObject({
      status: 'pending',
      fetchStatus: 'idle',
      data: undefined,
    })

    expect(states[1]).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: 'hydrated',
    })
  })

  test('should call onSuccess after successful restoring', async () => {
    const key = queryKey()
    const queryClient = new QueryClient()
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => Promise.resolve('hydrated'),
    })

    const persister = createMockPersister()
    await persistQueryClientSave({ queryClient, persister })

    queryClient.clear()

    @Component({
      template: `
        <div>
          <h1>{{ state.data() }}</h1>
          <h2>fetchStatus: {{ state.fetchStatus() }}</h2>
        </div>
      `,
    })
    class Page {
      state = injectQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return 'fetched'
        },
      }))
    }

    const onSuccess = vi.fn()

    render(Page, {
      providers: [
        provideExperimentalZonelessChangeDetection(),
        provideTanStackQuery(
          queryClient,
          withPersistQueryClient([
            {
              persistOptions: { persister },
              onSuccess,
            },
          ]),
        ),
      ],
    })

    expect(onSuccess).toHaveBeenCalledTimes(0)
    await waitFor(() => screen.getByText('fetched'))
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  test('should remove cache after non-successful restoring', async () => {
    const key = queryKey()
    const onErrorMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const queryClient = new QueryClient()
    const removeClient = vi.fn()
    const [error, persister] = createMockErrorPersister(removeClient)

    @Component({
      template: `
        <div>
          <h1>{{ state.data() }}</h1>
          <h2>fetchStatus: {{ state.fetchStatus() }}</h2>
        </div>
      `,
    })
    class Page {
      state = injectQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return 'fetched'
        },
      }))
    }

    render(Page, {
      providers: [
        provideExperimentalZonelessChangeDetection(),
        provideTanStackQuery(
          queryClient,
          withPersistQueryClient([
            {
              persistOptions: { persister },
            },
          ]),
        ),
      ],
    })

    await waitFor(() => screen.getByText('fetched'))
    expect(removeClient).toHaveBeenCalledTimes(1)
    expect(onErrorMock).toHaveBeenCalledTimes(1)
    expect(onErrorMock).toHaveBeenNthCalledWith(1, error)
    onErrorMock.mockRestore()
  })

  test('should be able to support multiple persisters', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const states1: Array<{
      status: string
      fetchStatus: string
      data: string | undefined
    }> = []
    const states2: Array<{
      status: string
      fetchStatus: string
      data: string | undefined
    }> = []

    const queryClient = new QueryClient()
    await queryClient.prefetchQuery({
      queryKey: key1,
      queryFn: () => Promise.resolve('hydrated 1'),
    })

    const persister1 = createMockPersister()
    await persistQueryClientSave({ queryClient, persister: persister1 })
    queryClient.clear()

    const persister2 = createMockPersister()
    await queryClient.prefetchQuery({
      queryKey: key2,
      queryFn: () => Promise.resolve('hydrated 2'),
    })
    await persistQueryClientSave({ queryClient, persister: persister2 })
    queryClient.clear()

    @Component({
      template: `
        <div>
          <h1>{{ query1.data() }}</h1>
          <h2>fetchStatus: {{ query1.fetchStatus() }}</h2>
        </div>
        <div>
          <h1>{{ query2.data() }}</h1>
          <h2>fetchStatus: {{ query2.fetchStatus() }}</h2>
        </div>
      `,
    })
    class Page {
      query1 = injectQuery(() => ({
        queryKey: key1,
        queryFn: async () => {
          await sleep(10)
          return 'fetched 1'
        },
      }))
      query2 = injectQuery(() => ({
        queryKey: key2,
        queryFn: async () => {
          await sleep(10)
          return 'fetched 2'
        },
      }))

      _ = effect(() => {
        states1.push({
          status: this.query1.status(),
          fetchStatus: this.query1.fetchStatus(),
          data: this.query1.data(),
        })
        states2.push({
          status: this.query2.status(),
          fetchStatus: this.query2.fetchStatus(),
          data: this.query2.data(),
        })
      })
    }

    const onSuccess1 = vi.fn()
    const onSuccess2 = vi.fn()

    render(Page, {
      providers: [
        provideExperimentalZonelessChangeDetection(),
        provideTanStackQuery(
          queryClient,
          withPersistQueryClient([
            {
              persistOptions: {
                persister: persister1,
              },
              onSuccess: onSuccess1,
            },
            {
              persistOptions: {
                persister: persister2,
              },
              onSuccess: onSuccess2,
            },
          ]),
        ),
      ],
    })

    expect(onSuccess1).toHaveBeenCalledTimes(0)
    expect(onSuccess2).toHaveBeenCalledTimes(0)
    await waitFor(() => screen.getByText('fetched 1'))
    await waitFor(() => screen.getByText('fetched 2'))
    expect(onSuccess1).toHaveBeenCalledTimes(1)
    expect(onSuccess2).toHaveBeenCalledTimes(1)
  })
})
