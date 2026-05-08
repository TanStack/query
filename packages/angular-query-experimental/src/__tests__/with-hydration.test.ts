import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  Component,
  EnvironmentInjector,
  PLATFORM_ID,
  TransferState,
  createEnvironmentInjector,
  effect,
  inject,
  makeStateKey,
  provideEnvironmentInitializer,
  provideZonelessChangeDetection,
} from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { render } from '@testing-library/angular'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  QueryClient,
  dehydrate,
  injectQuery,
  provideTanStackQuery,
  withHydrationKey,
  withNoQueryHydration,
} from '..'
import { INTERNAL_TANSTACK_QUERY_HYDRATION_STATE_KEY } from '../hydration-state-key'
import type { DehydratedState } from '@tanstack/query-core'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('TransferState hydration (client)', () => {
  test('browser hydrates from default key', async () => {
    const key = queryKey()
    const sourceClient = new QueryClient()
    sourceClient.setQueryData(key, 'from-server')
    const dehydrated = dehydrate(sourceClient)
    const appClient = new QueryClient()

    @Component({
      template: `<div>{{ state.data() ?? '' }}</div>`,
    })
    class Page {
      state = injectQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'from-client'),
      }))
    }

    const rendered = await render(Page, {
      providers: [
        provideZonelessChangeDetection(),
        provideEnvironmentInitializer(() => {
          inject(TransferState).set(
            INTERNAL_TANSTACK_QUERY_HYDRATION_STATE_KEY,
            dehydrated,
          )
        }),
        ...provideTanStackQuery(appClient),
      ],
    })

    rendered.fixture.detectChanges()
    expect(rendered.getByText('from-server')).toBeInTheDocument()
    expect(
      rendered.fixture.debugElement.injector
        .get(TransferState)
        .get(INTERNAL_TANSTACK_QUERY_HYDRATION_STATE_KEY, null),
    ).toBeNull()
  })

  test('browser hydrates from custom key', async () => {
    const customKeyName = 'tanstack-test-custom-hydration'
    const customKey = makeStateKey<DehydratedState>(customKeyName)
    const key = queryKey()
    const sourceClient = new QueryClient()
    sourceClient.setQueryData(key, 'from-custom-key')
    const dehydrated = dehydrate(sourceClient)
    const appClient = new QueryClient()

    @Component({
      template: `<div>{{ state.data() ?? '' }}</div>`,
    })
    class Page {
      state = injectQuery(() => ({
        queryKey: key,
        queryFn: () => Promise.resolve('from-client'),
      }))
    }

    const rendered = await render(Page, {
      providers: [
        provideZonelessChangeDetection(),
        provideEnvironmentInitializer(() => {
          inject(TransferState).set(customKey, dehydrated)
        }),
        ...provideTanStackQuery(appClient, withHydrationKey(customKeyName)),
      ],
    })

    rendered.fixture.detectChanges()
    expect(rendered.getByText('from-custom-key')).toBeTruthy()
    expect(rendered.fixture.debugElement.injector.get(TransferState).get(customKey, null)).toBeNull()
  })

  test('browser does not re-fetch when hydrated state is fresh', async () => {
    const key = queryKey()
    const sourceClient = new QueryClient()
    sourceClient.setQueryData(key, 'cached')
    const dehydrated = dehydrate(sourceClient)
    const appClient = new QueryClient()
    let queryFnCalls = 0

    @Component({
      template: `<div>{{ state.data() ?? '' }}</div>`,
    })
    class Page {
      state = injectQuery(() => ({
        queryKey: key,
        staleTime: Infinity,
        queryFn: () => {
          queryFnCalls++
          return sleep(10).then(() => 'should-not-run')
        },
      }))

      _ = effect(() => {
        void this.state.data()
      })
    }

    await render(Page, {
      providers: [
        provideZonelessChangeDetection(),
        provideEnvironmentInitializer(() => {
          inject(TransferState).set(
            INTERNAL_TANSTACK_QUERY_HYDRATION_STATE_KEY,
            dehydrated,
          )
        }),
        ...provideTanStackQuery(appClient),
      ],
    })

    await vi.advanceTimersByTimeAsync(100)
    expect(queryFnCalls).toBe(0)
  })

  test('withNoQueryHydration disables browser hydration', async () => {
    const key = queryKey()
    const sourceClient = new QueryClient()
    sourceClient.setQueryData(key, 'from-server')
    const dehydrated = dehydrate(sourceClient)
    const appClient = new QueryClient()

    @Component({
      template: `<div>{{ state.data() ?? '' }}</div>`,
    })
    class Page {
      state = injectQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'from-client'),
      }))
    }

    const rendered = await render(Page, {
      providers: [
        provideZonelessChangeDetection(),
        provideEnvironmentInitializer(() => {
          inject(TransferState).set(
            INTERNAL_TANSTACK_QUERY_HYDRATION_STATE_KEY,
            dehydrated,
          )
        }),
        ...provideTanStackQuery(appClient, withNoQueryHydration()),
      ],
    })

    rendered.fixture.detectChanges()
    await vi.advanceTimersByTimeAsync(10)
    rendered.fixture.detectChanges()

    expect(rendered.getByText('from-client')).toBeInTheDocument()
    expect(
      rendered.fixture.debugElement.injector
        .get(TransferState)
        .get(INTERNAL_TANSTACK_QUERY_HYDRATION_STATE_KEY, null),
    ).toEqual(dehydrated)
  })
})

describe('TransferState dehydration (server)', () => {
  function createQueryInjector(
    queryClient: QueryClient,
    platformId: 'server' | 'browser',
    ...features: Array<Parameters<typeof provideTanStackQuery>[1]>
  ) {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: PLATFORM_ID, useValue: platformId },
      ],
    })

    return createEnvironmentInjector(
      [...provideTanStackQuery(queryClient, ...features)],
      TestBed.inject(EnvironmentInjector),
    )
  }

  test('server serializes dehydrated queries on TransferState.toJson', async () => {
    const key = queryKey()
    const queryClient = new QueryClient()
    const injector = createQueryInjector(queryClient, 'server')

    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => Promise.resolve('ssr-data'),
    })
    await vi.advanceTimersByTimeAsync(0)

    injector.get(TransferState).toJson()

    const stored = injector.get(TransferState).get(
      INTERNAL_TANSTACK_QUERY_HYDRATION_STATE_KEY,
      null,
    )
    expect(stored).not.toBeNull()
    if (!stored) throw new Error('expected dehydrated state')
    expect(stored.queries.length).toBe(1)
    expect(stored.queries[0]?.queryKey).toEqual(key)
  })

  test('browser platform does not write server dehydration state', async () => {
    const key = queryKey()
    const queryClient = new QueryClient()
    const injector = createQueryInjector(queryClient, 'browser')

    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => Promise.resolve('data'),
    })
    await vi.advanceTimersByTimeAsync(0)

    injector.get(TransferState).toJson()

    expect(
      injector.get(TransferState).get(
        INTERNAL_TANSTACK_QUERY_HYDRATION_STATE_KEY,
        null,
      ),
    ).toBeNull()
  })

  test('withNoQueryHydration disables server dehydration', async () => {
    const key = queryKey()
    const queryClient = new QueryClient()
    const injector = createQueryInjector(
      queryClient,
      'server',
      withNoQueryHydration(),
    )

    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => Promise.resolve('data'),
    })
    await vi.advanceTimersByTimeAsync(0)

    injector.get(TransferState).toJson()

    expect(
      injector.get(TransferState).get(
        INTERNAL_TANSTACK_QUERY_HYDRATION_STATE_KEY,
        null,
      ),
    ).toBeNull()
  })

  test('multiple query clients can use distinct hydration keys', async () => {
    const keyA = queryKey()
    const keyB = queryKey()
    const clientA = new QueryClient()
    const clientB = new QueryClient()

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    })

    createEnvironmentInjector(
      [...provideTanStackQuery(clientA, withHydrationKey('client-a'))],
      TestBed.inject(EnvironmentInjector),
    )
    createEnvironmentInjector(
      [...provideTanStackQuery(clientB, withHydrationKey('client-b'))],
      TestBed.inject(EnvironmentInjector),
    )

    clientA.setQueryData(keyA, 'a')
    clientB.setQueryData(keyB, 'b')

    const transferState = TestBed.inject(TransferState)
    transferState.toJson()

    expect(transferState.get(makeStateKey<DehydratedState>('client-a'), null)?.queries[0]?.queryKey).toEqual(keyA)
    expect(transferState.get(makeStateKey<DehydratedState>('client-b'), null)?.queries[0]?.queryKey).toEqual(keyB)
  })
})
