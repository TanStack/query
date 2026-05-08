import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  QueryClient,
  injectIsRestoring,
  injectQueries,
  injectQuery,
  provideTanStackQuery,
} from '@tanstack/angular-query-experimental'
import { persistQueryClientSave } from '@tanstack/query-persist-client-core'
import {
  Component,
  EnvironmentInjector,
  InjectionToken,
  PLATFORM_ID,
  createEnvironmentInjector,
  effect,
  provideZonelessChangeDetection,
} from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { render } from '@testing-library/angular'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import * as persistClientCore from '@tanstack/query-persist-client-core'
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
        ...provideTanStackQuery(
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

  test('restores cache for injectQueries and keeps it idle while restoring', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const states: Array<
      Array<{
        status: string
        fetchStatus: string
        data: string | undefined
      }>
    > = []

    const queryClient = new QueryClient()
    queryClient.prefetchQuery({
      queryKey: key1,
      queryFn: () => sleep(10).then(() => 'hydrated-1'),
    })
    queryClient.prefetchQuery({
      queryKey: key2,
      queryFn: () => sleep(10).then(() => 'hydrated-2'),
    })
    await vi.advanceTimersByTimeAsync(10)

    const persister = createMockPersister()
    persistQueryClientSave({ queryClient, persister })
    await vi.advanceTimersByTimeAsync(0)
    queryClient.clear()

    @Component({
      template: `
        <div>
          <h1>{{ formattedData() }}</h1>
          <h2>fetchStatus: {{ formattedFetchStatus() }}</h2>
        </div>
      `,
    })
    class Page {
      state = injectQueries(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: () => sleep(10).then(() => 'fetched-1'),
          },
          {
            queryKey: key2,
            queryFn: () => sleep(10).then(() => 'fetched-2'),
          },
        ],
      }))

      _ = effect(() => {
        states.push(
          this.state().map((query) => ({
            status: query.status(),
            fetchStatus: query.fetchStatus(),
            data: query.data(),
          })),
        )
      })

      formattedData() {
        return this.state()
          .map((query) => query.data() ?? 'null')
          .join(',')
      }

      formattedFetchStatus() {
        return this.state()
          .map((query) => query.fetchStatus())
          .join(',')
      }
    }

    const rendered = await render(Page, {
      providers: [
        provideZonelessChangeDetection(),
        ...provideTanStackQuery(
          queryClient,
          withPersistQueryClient({ persistOptions: { persister } }),
        ),
      ],
    })

    expect(rendered.getByText('fetchStatus: idle,idle')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(10)
    rendered.fixture.detectChanges()
    expect(rendered.getByText('hydrated-1,hydrated-2')).toBeInTheDocument()
    expect(
      rendered.getByText('fetchStatus: fetching,fetching'),
    ).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()
    expect(rendered.getByText('fetched-1,fetched-2')).toBeInTheDocument()
    expect(rendered.getByText('fetchStatus: idle,idle')).toBeInTheDocument()

    expect(states[0]).toMatchObject([
      { status: 'pending', fetchStatus: 'idle', data: undefined },
      { status: 'pending', fetchStatus: 'idle', data: undefined },
    ])
    expect(states).toContainEqual([
      { status: 'success', fetchStatus: 'fetching', data: 'hydrated-1' },
      { status: 'success', fetchStatus: 'fetching', data: 'hydrated-2' },
    ])
    expect(states[states.length - 1]).toMatchObject([
      { status: 'success', fetchStatus: 'idle', data: 'fetched-1' },
      { status: 'success', fetchStatus: 'idle', data: 'fetched-2' },
    ])
  })

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
        ...provideTanStackQuery(
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
        queryFn: async () => {
          await sleep(10)
          fetched = true
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

    const rendered = await render(Page, {
      providers: [
        provideZonelessChangeDetection(),
        ...provideTanStackQuery(
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
        ...provideTanStackQuery(
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

  test('should await onSuccess before refetching or subscribing', async () => {
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

    const fetchSpy = vi.fn(() => sleep(10).then(() => 'fetched'))
    const onSuccess = vi.fn(async () => {
      await sleep(20)
    })

    @Component({
      template: `
        <div>
          <h1>{{ state.data() ?? 'null' }}</h1>
          <h2>fetchStatus: {{ state.fetchStatus() }}</h2>
        </div>
      `,
    })
    class Page {
      state = injectQuery(() => ({
        queryKey: key,
        queryFn: fetchSpy,
      }))
    }

    const rendered = await render(Page, {
      providers: [
        provideZonelessChangeDetection(),
        ...provideTanStackQuery(
          queryClient,
          withPersistQueryClient({
            persistOptions: { persister },
            onSuccess,
          }),
        ),
      ],
    })

    await vi.advanceTimersByTimeAsync(10)
    rendered.fixture.detectChanges()
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledTimes(0)
    expect(rendered.getByText('fetchStatus: idle')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(19)
    rendered.fixture.detectChanges()
    expect(fetchSpy).toHaveBeenCalledTimes(0)

    await vi.advanceTimersByTimeAsync(1)
    rendered.fixture.detectChanges()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(rendered.getByText('hydrated')).toBeInTheDocument()
    expect(rendered.getByText('fetchStatus: fetching')).toBeInTheDocument()

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
        ...provideTanStackQuery(
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

  test('should await onError before starting queries after restore failure', async () => {
    const key = queryKey()
    const onErrorMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const queryClient = new QueryClient()
    const removeClient = vi.fn()
    const [, persister] = createMockErrorPersister(removeClient)
    const fetchSpy = vi.fn(() => sleep(10).then(() => 'fetched'))
    const onError = vi.fn(async () => {
      await sleep(20)
    })

    @Component({
      template: `
        <div>
          <h1>{{ state.data() ?? 'null' }}</h1>
          <h2>fetchStatus: {{ state.fetchStatus() }}</h2>
        </div>
      `,
    })
    class Page {
      state = injectQuery(() => ({
        queryKey: key,
        queryFn: fetchSpy,
      }))
    }

    const rendered = await render(Page, {
      providers: [
        provideZonelessChangeDetection(),
        ...provideTanStackQuery(
          queryClient,
          withPersistQueryClient({
            persistOptions: { persister },
            onError,
          }),
        ),
      ],
    })

    await vi.advanceTimersByTimeAsync(10)
    rendered.fixture.detectChanges()
    expect(onError).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledTimes(0)
    expect(rendered.getByText('fetchStatus: idle')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(19)
    rendered.fixture.detectChanges()
    expect(fetchSpy).toHaveBeenCalledTimes(0)

    await vi.advanceTimersByTimeAsync(1)
    rendered.fixture.detectChanges()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(rendered.getByText('fetchStatus: fetching')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()
    expect(rendered.getByText('fetched')).toBeInTheDocument()

    onErrorMock.mockRestore()
  })

  test('factory form with deps receives injected token and restores cache', async () => {
    const key = queryKey()
    const holder = { persister: createMockPersister() }
    const HOLDER = new InjectionToken<{ persister: Persister }>(
      'persist-test-holder',
    )

    const queryClient = new QueryClient()
    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'hydrated'),
    })
    await vi.advanceTimersByTimeAsync(10)

    persistQueryClientSave({ queryClient, persister: holder.persister })
    await vi.advanceTimersByTimeAsync(0)

    queryClient.clear()

    @Component({
      template: `
        <div>
          <h1>{{ state.data() }}</h1>
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
        { provide: HOLDER, useValue: holder },
        ...provideTanStackQuery(
          queryClient,
          withPersistQueryClient(
            (h) => ({
              persistOptions: { persister: h.persister },
            }),
            { deps: [HOLDER] },
          ),
        ),
      ],
    })

    await vi.advanceTimersByTimeAsync(10)
    rendered.fixture.detectChanges()
    expect(rendered.getByText('hydrated')).toBeInTheDocument()
  })

  test('factory callback runs only in browser mode', async () => {
    const factory = vi.fn(() => ({
      persistOptions: {
        persister: createMockPersister(),
      },
    }))

    @Component({
      template: `{{ isRestoring() }}`,
    })
    class Page {
      isRestoring = injectIsRestoring()
    }

    const rendered = await render(Page, {
      providers: [
        provideZonelessChangeDetection(),
        { provide: PLATFORM_ID, useValue: 'server' },
        ...provideTanStackQuery(new QueryClient(), withPersistQueryClient(factory)),
      ],
    })

    rendered.fixture.detectChanges()

    expect(factory).not.toHaveBeenCalled()
    expect(rendered.fixture.nativeElement.textContent.trim()).toBe('false')
  })

  test('cleanup subscription runs on injector destroy', async () => {
    const key = queryKey()
    const queryClient = new QueryClient()
    const persister = createMockPersister()
    const cleanup = vi.fn()
    const subscribeSpy = vi
      .spyOn(persistClientCore, 'persistQueryClientSubscribe')
      .mockReturnValue(cleanup)

    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'hydrated'),
    })
    await vi.advanceTimersByTimeAsync(10)
    persistQueryClientSave({ queryClient, persister })
    await vi.advanceTimersByTimeAsync(0)
    queryClient.clear()
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    })

    const injector = createEnvironmentInjector(
      [
        ...provideTanStackQuery(
          queryClient,
          withPersistQueryClient({ persistOptions: { persister } }),
        ),
      ],
      TestBed.inject(EnvironmentInjector),
    )

    await vi.advanceTimersByTimeAsync(10)
    injector.destroy()

    expect(subscribeSpy).toHaveBeenCalledTimes(1)
    expect(cleanup).toHaveBeenCalledTimes(1)
  })
})
