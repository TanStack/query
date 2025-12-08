import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  QueryClient,
  injectQuery,
  provideTanStackQuery,
} from '@tanstack/angular-query-experimental'
import { persistQueryClientSave } from '@tanstack/query-persist-client-core'
import {
  Component,
  effect,
  provideZonelessChangeDetection,
} from '@angular/core'
import { render } from '@testing-library/angular'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { withPersistQueryClient } from '../with-persist-query-client'
import type {
  PersistedClient,
  Persister,
} from '@tanstack/query-persist-client-core'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

const createMockPersister = (): Persister => {
  let storedState: PersistedClient | undefined

  return {
    persistClient(persistClient: PersistedClient) {
      storedState = persistClient
    },
    async restoreClient() {
      return sleep(10).then(() => storedState)
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
        return sleep(10).then(() => {
          throw error
        })
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
    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'hydrated'),
    })
    await vi.advanceTimersByTimeAsync(10)

    const persister = createMockPersister()

    persistQueryClientSave({ queryClient, persister })
    await vi.advanceTimersByTimeAsync(0)

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
        queryFn: () => sleep(10).then(() => 'fetched'),
      }))
      _ = effect(() => {
        states.push({
          status: this.state.status(),
          fetchStatus: this.state.fetchStatus(),
          data: this.state.data(),
        })
      })
    }

    const rendered = await render(Page, {
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(
          queryClient,
          withPersistQueryClient({ persistOptions: { persister } }),
        ),
      ],
    })

    expect(rendered.getByText('fetchStatus: idle')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    rendered.fixture.detectChanges()
    expect(rendered.getByText('hydrated')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()
    expect(rendered.getByText('fetched')).toBeInTheDocument()

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
    '(Once injectQueries is functional) verify that injectQueries transitions to an idle state',
  )

  test('should show initialData while restoring', async () => {
    const key = queryKey()
    const states: Array<{
      status: string
      fetchStatus: string
      data: string | undefined
    }> = []

    const queryClient = new QueryClient()
    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'hydrated'),
    })
    await vi.advanceTimersByTimeAsync(10)

    const persister = createMockPersister()

    persistQueryClientSave({ queryClient, persister })
    await vi.advanceTimersByTimeAsync(0)

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
        queryFn: () => sleep(10).then(() => 'fetched'),
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

    const rendered = await render(Page, {
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(
          queryClient,
          withPersistQueryClient({ persistOptions: { persister } }),
        ),
      ],
    })

    expect(rendered.getByText('initial')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    rendered.fixture.detectChanges()
    expect(rendered.getByText('hydrated')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()
    expect(rendered.getByText('fetched')).toBeInTheDocument()

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
    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'hydrated'),
    })
    await vi.advanceTimersByTimeAsync(10)

    const persister = createMockPersister()

    persistQueryClientSave({ queryClient, persister })
    await vi.advanceTimersByTimeAsync(0)

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
        queryFn: () =>
          sleep(10).then(() => {
            fetched = true
            return 'fetched'
          }),
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

    const rendered = await render(Page, {
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(
          queryClient,
          withPersistQueryClient({ persistOptions: { persister } }),
        ),
      ],
    })

    expect(rendered.getByText('data: null')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    rendered.fixture.detectChanges()
    expect(rendered.getByText('data: hydrated')).toBeInTheDocument()

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
    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'hydrated'),
    })
    await vi.advanceTimersByTimeAsync(10)

    const persister = createMockPersister()
    persistQueryClientSave({ queryClient, persister })
    await vi.advanceTimersByTimeAsync(0)

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
        queryFn: () => sleep(10).then(() => 'fetched'),
      }))
    }

    const onSuccess = vi.fn()

    const rendered = await render(Page, {
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(
          queryClient,
          withPersistQueryClient({
            persistOptions: { persister },
            onSuccess,
          }),
        ),
      ],
    })

    expect(onSuccess).toHaveBeenCalledTimes(0)
    await vi.advanceTimersByTimeAsync(10)
    rendered.fixture.detectChanges()
    expect(rendered.getByText('hydrated')).toBeInTheDocument()
    expect(onSuccess).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()
    expect(rendered.getByText('fetched')).toBeInTheDocument()
  })

  test('should remove cache after non-successful restoring', async () => {
    const key = queryKey()
    const onErrorMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const queryClient = new QueryClient()
    const removeClient = vi.fn()
    const [error, persister] = createMockErrorPersister(removeClient)
    const onSuccess = vi.fn()
    const onError = vi.fn()

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
        queryFn: () => sleep(10).then(() => 'fetched'),
      }))
    }

    const rendered = await render(Page, {
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(
          queryClient,
          withPersistQueryClient({
            persistOptions: { persister },
            onSuccess,
            onError,
          }),
        ),
      ],
    })

    await vi.advanceTimersByTimeAsync(10)
    rendered.fixture.detectChanges()
    expect(removeClient).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledTimes(0)
    expect(onError).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()
    expect(rendered.getByText('fetched')).toBeInTheDocument()

    expect(onErrorMock).toHaveBeenCalledTimes(1)
    expect(onErrorMock).toHaveBeenNthCalledWith(1, error)
    onErrorMock.mockRestore()
  })
})
