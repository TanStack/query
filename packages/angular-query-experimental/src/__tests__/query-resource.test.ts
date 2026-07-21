import {
  Component,
  EnvironmentInjector,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/angular'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  QueryCache,
  QueryClient,
  injectQuery,
  onlineManager,
  provideTanStackQuery,
  queryResource,
} from '..'

// Ported from angular-resource-query: query-resource.spec.ts, select-placeholder.spec.ts,
// ref-actions.spec.ts, cancellation.spec.ts, gc.spec.ts, network-mode.spec.ts,
// refetch-interval.spec.ts, structural-sharing-query.spec.ts, store-imperative.spec.ts.
// Assertions reflect TanStack core semantics (e.g. a background refetch error sets
// status to 'error' even when cached data is preserved).
describe('queryResource', () => {
  let queryCache: QueryCache
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryCache = new QueryCache()
    queryClient = new QueryClient({ queryCache })
    onlineManager.setOnline(true)
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(queryClient),
      ],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('basics', () => {
    it('config form: resolves and exposes the resource + query surface', async () => {
      const key = queryKey()

      @Component({
        template: `
          <div>status: {{ q.status() }}</div>
          <div>queryStatus: {{ q.queryStatus() }}</div>
          <div>data: {{ q.data() ?? 'none' }}</div>
          @if (q.hasValue()) {
            <div>value: {{ q.value() }}</div>
          }
          <div>isLoading: {{ q.isLoading() }}</div>
          <div>isSuccess: {{ q.isSuccess() }}</div>
        `,
      })
      class Page {
        readonly q = queryResource({
          queryKey: () => key,
          queryFn: () => sleep(10).then(() => 'result'),
        })
      }

      const rendered = await render(Page)
      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()

      expect(rendered.getByText('status: resolved')).toBeInTheDocument()
      expect(rendered.getByText('queryStatus: success')).toBeInTheDocument()
      expect(rendered.getByText('data: result')).toBeInTheDocument()
      expect(rendered.getByText('value: result')).toBeInTheDocument()
      expect(rendered.getByText('isLoading: false')).toBeInTheDocument()
      expect(rendered.getByText('isSuccess: true')).toBeInTheDocument()
    })

    it('options-function form resolves (whole-object reactive)', async () => {
      const key = queryKey()

      @Component({
        template: `<div>data: {{ q.data() ?? 'none' }}</div>`,
      })
      class Page {
        readonly q = queryResource(() => ({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'fn-form'),
        }))
      }

      const rendered = await render(Page)
      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()

      expect(rendered.getByText('data: fn-form')).toBeInTheDocument()
    })

    it('can be created with an explicit injector', async () => {
      const key = queryKey()
      const injector = TestBed.inject(EnvironmentInjector)
      const q = queryResource(
        {
          queryKey: () => key,
          queryFn: () => sleep(10).then(() => 'with-injector'),
        },
        { injector },
      )
      TestBed.tick()
      await vi.advanceTimersByTimeAsync(11)
      expect(q.data()).toBe('with-injector')
    })
  })

  describe('reactive key (config form)', () => {
    it('deduplicates: two consumers of the same key fetch once and share data', async () => {
      const key = queryKey()
      const queryFn = vi.fn(() => sleep(10).then(() => 'shared'))

      @Component({
        template: `
          <div>r: {{ r.data() ?? 'none' }}</div>
          <div>i: {{ i.data() ?? 'none' }}</div>
        `,
      })
      class Page {
        readonly r = queryResource({ queryKey: () => key, queryFn })
        readonly i = injectQuery(() => ({ queryKey: key, queryFn }))
      }

      const rendered = await render(Page)
      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()

      expect(rendered.getByText('r: shared')).toBeInTheDocument()
      expect(rendered.getByText('i: shared')).toBeInTheDocument()
      expect(queryFn).toHaveBeenCalledTimes(1)
    })

    it('refetches when the reactive key changes', async () => {
      const queryFn = vi.fn((id: number) =>
        sleep(10).then(() => `user-${id}`),
      )

      @Component({
        template: `<div>data: {{ q.data() ?? 'none' }}</div>`,
      })
      class Page {
        readonly id = signal(1)
        readonly q = queryResource({
          queryKey: () => ['user', this.id()],
          queryFn: ({ queryKey }) => queryFn(queryKey[1] as number),
        })
      }

      const rendered = await render(Page)
      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()
      expect(rendered.getByText('data: user-1')).toBeInTheDocument()

      rendered.fixture.componentInstance.id.set(2)
      rendered.fixture.detectChanges()
      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()

      expect(rendered.getByText('data: user-2')).toBeInTheDocument()
      expect(queryFn).toHaveBeenCalledTimes(2)
    })
  })

  describe('select & placeholderData', () => {
    it('select() projects the cached data into a derived view', async () => {
      const key = queryKey()

      @Component({
        template: `<div>data: {{ q.data() ?? 'none' }}</div>`,
      })
      class Page {
        readonly q = queryResource<
          { first: string; last: string },
          Error,
          string
        >({
          queryKey: () => key,
          queryFn: () => sleep(10).then(() => ({ first: 'Ada', last: 'L' })),
          select: (user) => `${user.first} ${user.last}`,
        })
      }

      const rendered = await render(Page)
      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()

      expect(rendered.getByText('data: Ada L')).toBeInTheDocument()
    })

    it('placeholderData keeps the previous value visible while a new key loads', async () => {
      const queryFn = (id: number) => sleep(10).then(() => `item-${id}`)

      @Component({
        template: `
          <div>data: {{ q.data() ?? 'none' }}</div>
          <div>placeholder: {{ q.isPlaceholderData() }}</div>
        `,
      })
      class Page {
        readonly id = signal(1)
        readonly q = queryResource({
          queryKey: () => ['ph', this.id()],
          queryFn: ({ queryKey }) => queryFn(queryKey[1] as number),
          placeholderData: (previous: string | undefined) => previous,
        })
      }

      const rendered = await render(Page)
      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()
      expect(rendered.getByText('data: item-1')).toBeInTheDocument()

      // Switch key: before the new fetch resolves, the previous data stays.
      rendered.fixture.componentInstance.id.set(2)
      rendered.fixture.detectChanges()
      expect(rendered.getByText('data: item-1')).toBeInTheDocument()
      expect(rendered.getByText('placeholder: true')).toBeInTheDocument()

      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()
      expect(rendered.getByText('data: item-2')).toBeInTheDocument()
      expect(rendered.getByText('placeholder: false')).toBeInTheDocument()
    })
  })

  describe('actions', () => {
    it('set() and update() write the cached value through setQueryData', async () => {
      const key = queryKey()

      @Component({
        template: `<div>data: {{ q.data() ?? 'none' }}</div>`,
      })
      class Page {
        readonly q = queryResource({
          queryKey: () => key,
          queryFn: () => sleep(10).then(() => 'server'),
        })
      }

      const rendered = await render(Page)
      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()
      expect(rendered.getByText('data: server')).toBeInTheDocument()

      rendered.fixture.componentInstance.q.set('manual')
      rendered.fixture.detectChanges()
      expect(rendered.getByText('data: manual')).toBeInTheDocument()
      expect(queryClient.getQueryData(key)).toBe('manual')

      rendered.fixture.componentInstance.q.update((value) => `${value}!`)
      rendered.fixture.detectChanges()
      expect(rendered.getByText('data: manual!')).toBeInTheDocument()
    })

    it('reload() refetches the query', async () => {
      const key = queryKey()
      const queryFn = vi.fn(() => sleep(10).then(() => 'v'))

      @Component({
        template: `<div>data: {{ q.data() ?? 'none' }}</div>`,
      })
      class Page {
        readonly q = queryResource({ queryKey: () => key, queryFn })
      }

      const rendered = await render(Page)
      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()
      expect(queryFn).toHaveBeenCalledTimes(1)

      rendered.fixture.componentInstance.q.reload()
      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()
      expect(queryFn).toHaveBeenCalledTimes(2)
    })

    it('preserves cached data when a refetch errors (TanStack semantics)', async () => {
      const key = queryKey()
      const queryFn = vi
        .fn()
        .mockImplementationOnce(() => sleep(10).then(() => 'server'))
        .mockImplementationOnce(() =>
          sleep(10).then(() => Promise.reject(new Error('boom'))),
        )

      @Component({
        template: `<div>data: {{ q.data() ?? 'none' }}</div>`,
      })
      class Page {
        readonly q = queryResource({
          queryKey: () => key,
          queryFn,
          retry: false,
        })
      }

      const rendered = await render(Page)
      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()
      const q = rendered.fixture.componentInstance.q
      expect(q.data()).toBe('server')

      await q.refetch()
      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()

      // Cached data stays visible (resource value does not throw, hasValue stays true),
      // while the failure is surfaced via the TanStack status fields.
      expect(q.data()).toBe('server')
      expect(q.hasValue()).toBe(true)
      expect(q.value()).toBe('server')
      expect(q.status()).toBe('resolved')
      expect(q.queryStatus()).toBe('error')
      expect(q.isError()).toBe(true)
      expect(q.failureReason()?.message).toBe('boom')
    })

    it('first-load error: data() is safe, hasValue() is false, value() throws', async () => {
      const key = queryKey()

      @Component({
        template: `
          <div>queryStatus: {{ q.queryStatus() }}</div>
          <div>data: {{ q.data() ?? 'none' }}</div>
          <div>hasValue: {{ q.hasValue() }}</div>
          <div>error: {{ q.error()?.message ?? 'none' }}</div>
        `,
      })
      class Page {
        readonly q = queryResource({
          queryKey: () => key,
          queryFn: () =>
            sleep(10).then(() => Promise.reject(new Error('boom'))),
          retry: false,
        })
      }

      const rendered = await render(Page)
      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()

      expect(rendered.getByText('queryStatus: error')).toBeInTheDocument()
      expect(rendered.getByText('data: none')).toBeInTheDocument()
      expect(rendered.getByText('hasValue: false')).toBeInTheDocument()
      expect(rendered.getByText('error: boom')).toBeInTheDocument()
      expect(() => rendered.fixture.componentInstance.q.value()).toThrow()
    })

    it('counts consecutive failures via failureCount', async () => {
      const key = queryKey()
      const failing = vi.fn().mockRejectedValue(new Error('always fails'))

      @Component({
        template: `<div>fc: {{ q.failureCount() }}</div>`,
      })
      class Page {
        readonly q = queryResource({
          queryKey: () => key,
          queryFn: () => failing(),
          retry: 1,
          retryDelay: 0,
        })
      }

      const rendered = await render(Page)
      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()

      expect(failing).toHaveBeenCalledTimes(2) // initial + 1 retry
      const q = rendered.fixture.componentInstance.q
      expect(q.failureCount()).toBe(2)
      expect(q.isError()).toBe(true)
    })
  })

  describe('structural sharing', () => {
    it('keeps unchanged subtrees referentially stable across refetches', async () => {
      const key = queryKey()
      let version = 0
      const queryFn = () =>
        sleep(10).then(() => ({ user: { id: 1, name: 'Ada' }, version: ++version }))

      @Component({
        template: `<div>v: {{ q.data()?.version ?? 'none' }}</div>`,
      })
      class Page {
        readonly q = queryResource({ queryKey: () => key, queryFn })
      }

      const rendered = await render(Page)
      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()
      const q = rendered.fixture.componentInstance.q
      const firstUser = q.data()?.user
      expect(q.data()?.version).toBe(1)

      await q.refetch()
      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()

      expect(q.data()?.version).toBe(2) // top-level object changed
      expect(q.data()?.user).toBe(firstUser) // unchanged subtree kept its identity
    })
  })

  describe('cancellation & gc', () => {
    it('aborts the in-flight fetch when cancelQueries is called', async () => {
      const key = queryKey()
      const signals: Array<AbortSignal> = []

      @Component({
        template: `<div>{{ q.fetchStatus() }}</div>`,
      })
      class Page {
        readonly q = queryResource<string>({
          queryKey: () => key,
          queryFn: ({ signal }) => {
            signals.push(signal)
            return new Promise<string>(() => {})
          },
        })
      }

      const rendered = await render(Page)
      await vi.advanceTimersByTimeAsync(0)
      rendered.fixture.detectChanges()
      expect(signals.length).toBe(1)
      expect(signals[0]!.aborted).toBe(false)

      void queryClient.cancelQueries({ queryKey: key })
      await vi.advanceTimersByTimeAsync(0)
      expect(signals[0]!.aborted).toBe(true)
    })

    it('disposes an unused query after gcTime and refetches on remount', async () => {
      const key = queryKey()
      const queryFn = vi.fn(() => sleep(10).then(() => 'value'))

      @Component({
        template: `<div>data: {{ q.data() ?? 'none' }}</div>`,
      })
      class Page {
        readonly q = queryResource({ queryKey: () => key, queryFn, gcTime: 100 })
      }

      const first = await render(Page)
      await vi.advanceTimersByTimeAsync(11)
      first.fixture.detectChanges()
      expect(queryFn).toHaveBeenCalledTimes(1)
      expect(queryCache.find({ queryKey: key })).toBeDefined()

      first.fixture.destroy()
      await vi.advanceTimersByTimeAsync(101)
      expect(queryCache.find({ queryKey: key })).toBeUndefined()

      const second = await render(Page)
      await vi.advanceTimersByTimeAsync(11)
      second.fixture.detectChanges()
      expect(queryFn).toHaveBeenCalledTimes(2)
    })
  })

  describe('networkMode', () => {
    it("pauses an 'online' query while offline and resumes on reconnect", async () => {
      const key = queryKey()
      const queryFn = vi.fn(() => sleep(10).then(() => 'loaded'))
      onlineManager.setOnline(false)

      @Component({
        template: `<div>{{ q.fetchStatus() }}</div>`,
      })
      class Page {
        readonly q = queryResource({
          queryKey: () => key,
          queryFn,
          networkMode: 'online',
          retry: false,
        })
      }

      const rendered = await render(Page)
      await vi.advanceTimersByTimeAsync(0)
      rendered.fixture.detectChanges()
      expect(rendered.fixture.componentInstance.q.fetchStatus()).toBe('paused')
      expect(queryFn).not.toHaveBeenCalled()

      onlineManager.setOnline(true)
      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()
      expect(queryFn).toHaveBeenCalledTimes(1)
      expect(rendered.fixture.componentInstance.q.data()).toBe('loaded')
    })
  })

  describe('refetchInterval', () => {
    it('refetches repeatedly on the interval while mounted', async () => {
      const key = queryKey()
      let counter = 0
      const queryFn = vi.fn(() => sleep(5).then(() => ++counter))

      @Component({
        template: `<div>data: {{ q.data() ?? 'none' }}</div>`,
      })
      class Page {
        readonly q = queryResource({
          queryKey: () => key,
          queryFn,
          refetchInterval: 30,
          refetchIntervalInBackground: true,
        })
      }

      const rendered = await render(Page)
      await vi.advanceTimersByTimeAsync(110)
      rendered.fixture.detectChanges()

      expect(queryFn.mock.calls.length).toBeGreaterThanOrEqual(2)
    })
  })
})
