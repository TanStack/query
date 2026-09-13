import {
  ApplicationRef,
  Component,
  Injector,
  computed,
  input,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { HttpClient, provideHttpClient } from '@angular/common/http'
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/angular'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { lastValueFrom } from 'rxjs'
import {
  QueryCache,
  QueryClient,
  injectQuery,
  provideIsRestoring,
  provideTanStackQuery,
  skipToken,
} from '..'
import { setSignalInputs } from './test-utils'

describe('injectQuery', () => {
  let queryCache: QueryCache
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryCache = new QueryCache()
    queryClient = new QueryClient({ queryCache })
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

  it('should return pending status initially', () => {
    const key = queryKey()
    const query = TestBed.runInInjectionContext(() => {
      return injectQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'Some data'),
      }))
    })

    expect(query.status()).toBe('pending')
    expect(query.isPending()).toBe(true)
    expect(query.isFetching()).toBe(true)
    expect(query.isStale()).toBe(true)
    expect(query.isFetched()).toBe(false)
  })

  it('should resolve to success and update signal: injectQuery()', async () => {
    const key = queryKey()

    @Component({
      template: `
        <div>status: {{ query.status() }}</div>
        <div>data: {{ query.data() ?? 'none' }}</div>
        <div>isPending: {{ query.isPending() }}</div>
        <div>isFetching: {{ query.isFetching() }}</div>
        <div>isFetched: {{ query.isFetched() }}</div>
        <div>isSuccess: {{ query.isSuccess() }}</div>
      `,
    })
    class Page {
      readonly query = injectQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'result2'),
      }))
    }

    const rendered = await render(Page)

    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()

    expect(rendered.getByText('status: success')).toBeInTheDocument()
    expect(rendered.getByText('data: result2')).toBeInTheDocument()
    expect(rendered.getByText('isPending: false')).toBeInTheDocument()
    expect(rendered.getByText('isFetching: false')).toBeInTheDocument()
    expect(rendered.getByText('isFetched: true')).toBeInTheDocument()
    expect(rendered.getByText('isSuccess: true')).toBeInTheDocument()
  })

  it('should reject and update signal', async () => {
    const key = queryKey()

    @Component({
      template: `
        <div>status: {{ query.status() }}</div>
        <div>data: {{ query.data() ?? 'none' }}</div>
        <div>error: {{ query.error()?.message ?? 'none' }}</div>
        <div>isPending: {{ query.isPending() }}</div>
        <div>isFetching: {{ query.isFetching() }}</div>
        <div>isError: {{ query.isError() }}</div>
        <div>failureCount: {{ query.failureCount() }}</div>
        <div>failureReason: {{ query.failureReason()?.message ?? 'none' }}</div>
      `,
    })
    class Page {
      readonly query = injectQuery(() => ({
        retry: false,
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Some error'))),
      }))
    }

    const rendered = await render(Page)

    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()

    expect(rendered.getByText('status: error')).toBeInTheDocument()
    expect(rendered.getByText('data: none')).toBeInTheDocument()
    expect(rendered.getByText('error: Some error')).toBeInTheDocument()
    expect(rendered.getByText('isPending: false')).toBeInTheDocument()
    expect(rendered.getByText('isFetching: false')).toBeInTheDocument()
    expect(rendered.getByText('isError: true')).toBeInTheDocument()
    expect(rendered.getByText('failureCount: 1')).toBeInTheDocument()
    expect(rendered.getByText('failureReason: Some error')).toBeInTheDocument()
  })

  it('should be able to select a part of the data with select', async () => {
    const key = queryKey()

    @Component({
      template: `<div>data: {{ query.data() ?? 'none' }}</div>`,
    })
    class Page {
      readonly query = injectQuery<{ name: string }, Error, string>(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => ({ name: 'test' })),
        select: (data) => data.name,
      }))
    }

    const rendered = await render(Page)

    expect(rendered.getByText('data: none')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()

    expect(rendered.getByText('data: test')).toBeInTheDocument()
  })

  it('should show placeholderData until queryFn resolves and then expose real data', async () => {
    const key = queryKey()

    @Component({
      template: `
        <div>data: {{ query.data() }}</div>
        <div>isPlaceholderData: {{ query.isPlaceholderData() }}</div>
        <div>isSuccess: {{ query.isSuccess() }}</div>
      `,
    })
    class Page {
      readonly query = injectQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'real-data'),
        placeholderData: 'placeholder',
      }))
    }

    const rendered = await render(Page)

    expect(rendered.getByText('data: placeholder')).toBeInTheDocument()
    expect(rendered.getByText('isPlaceholderData: true')).toBeInTheDocument()
    expect(rendered.getByText('isSuccess: true')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()

    expect(rendered.getByText('data: real-data')).toBeInTheDocument()
    expect(rendered.getByText('isPlaceholderData: false')).toBeInTheDocument()
    expect(rendered.getByText('isSuccess: true')).toBeInTheDocument()
  })

  it('should update query on options contained signal change', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const key = signal(key1)
    const spy = vi.fn(() => sleep(10).then(() => 'Some data'))

    const query = TestBed.runInInjectionContext(() => {
      return injectQuery(() => ({
        queryKey: key(),
        queryFn: spy,
      }))
    })

    await vi.advanceTimersByTimeAsync(0)
    expect(spy).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(10)
    expect(query.status()).toBe('success')

    key.set(key2)
    TestBed.tick()

    expect(spy).toHaveBeenCalledTimes(2)
    // should call queryFn with context containing the new queryKey
    expect(spy).toHaveBeenNthCalledWith(2, {
      client: queryClient,
      meta: undefined,
      queryKey: key2,
      signal: expect.anything(),
    })
  })

  it('should only run query once enabled signal is set to true', async () => {
    const key = queryKey()
    const spy = vi.fn(() => sleep(10).then(() => 'Some data'))
    const enabled = signal(false)

    const query = TestBed.runInInjectionContext(() => {
      return injectQuery(() => ({
        queryKey: key,
        queryFn: spy,
        enabled: enabled(),
      }))
    })

    expect(spy).not.toHaveBeenCalled()
    expect(query.status()).toBe('pending')

    enabled.set(true)

    await vi.advanceTimersByTimeAsync(10)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(query.status()).toBe('success')
  })

  it('should not fetch while the enabled signal is false, and fetch again once it is truthy', async () => {
    const key = queryKey()
    const spy = vi.fn(() => sleep(10).then(() => 'Some data'))
    const filter = signal('a')

    const query = TestBed.runInInjectionContext(() => {
      return injectQuery(() => ({
        queryKey: [...key, filter()],
        queryFn: spy,
        enabled: !!filter(),
      }))
    })

    await vi.advanceTimersByTimeAsync(10)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(query.status()).toBe('success')

    filter.set('')

    await vi.advanceTimersByTimeAsync(10)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(query.isFetching()).toBe(false)

    filter.set('b')

    await vi.advanceTimersByTimeAsync(10)
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('should properly execute dependent queries', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    const query1 = TestBed.runInInjectionContext(() => {
      return injectQuery(() => ({
        queryKey: key1,
        queryFn: () => sleep(10).then(() => 'Some data'),
      }))
    })

    const dependentQueryFn = vi
      .fn()
      .mockImplementation(() => sleep(1000).then(() => 'Some data'))

    const query2 = TestBed.runInInjectionContext(() => {
      return injectQuery(
        computed(() => ({
          queryKey: key2,
          queryFn: dependentQueryFn,
          enabled: !!query1.data(),
        })),
      )
    })

    expect(query1.data()).toStrictEqual(undefined)
    expect(query2.fetchStatus()).toStrictEqual('idle')
    expect(dependentQueryFn).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(11)

    expect(query1.data()).toStrictEqual('Some data')
    expect(query2.fetchStatus()).toStrictEqual('fetching')

    await vi.advanceTimersByTimeAsync(1002)

    expect(query2.fetchStatus()).toStrictEqual('idle')
    expect(query2.status()).toStrictEqual('success')
    expect(dependentQueryFn).toHaveBeenCalledTimes(1)
    expect(dependentQueryFn).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: key2 }),
    )
  })

  it('should use the current value for the queryKey when refetch is called', async () => {
    const key = queryKey()
    const fetchFn = vi.fn(() => sleep(10).then(() => 'Some data'))
    const keySignal = signal('key11')

    const query = TestBed.runInInjectionContext(() => {
      return injectQuery(() => ({
        queryKey: [...key, keySignal()],
        queryFn: fetchFn,
        enabled: false,
      }))
    })

    expect(fetchFn).not.toHaveBeenCalled()

    void query.refetch()
    await vi.advanceTimersByTimeAsync(10)

    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(fetchFn).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        queryKey: [...key, 'key11'],
      }),
    )

    keySignal.set('key12')

    void query.refetch()
    await vi.advanceTimersByTimeAsync(10)

    expect(fetchFn).toHaveBeenCalledTimes(2)
    expect(fetchFn).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        queryKey: [...key, 'key12'],
      }),
    )
    expect(query.data()).toBe('Some data')
  })

  it('should keep initialData visible alongside the error when a refetch fails', async () => {
    const key = queryKey()

    @Component({
      template: `
        <div>data: {{ query.data() }}</div>
        <div>isError: {{ query.isError() }}</div>
      `,
    })
    class Page {
      readonly query = injectQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Some error'))),
        initialData: 'initial',
        retry: false,
      }))
    }

    const rendered = await render(Page)

    expect(rendered.getByText('data: initial')).toBeInTheDocument()
    expect(rendered.getByText('isError: false')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()
    expect(rendered.getByText('data: initial')).toBeInTheDocument()
    expect(rendered.getByText('isError: true')).toBeInTheDocument()
  })

  describe('throwOnError', () => {
    it('should evaluate throwOnError when query is expected to throw', async () => {
      const key = queryKey()
      const boundaryFn = vi.fn()
      TestBed.runInInjectionContext(() => {
        return injectQuery(() => ({
          queryKey: key,
          queryFn: () =>
            sleep(10).then(() => Promise.reject(new Error('Some error'))),
          retry: false,
          throwOnError: boundaryFn,
        }))
      })

      await vi.advanceTimersByTimeAsync(11)
      expect(boundaryFn).toHaveBeenCalledTimes(1)
      expect(boundaryFn).toHaveBeenCalledWith(
        Error('Some error'),
        expect.objectContaining({
          state: expect.objectContaining({ status: 'error' }),
        }),
      )
    })

    it('should throw when throwOnError is true', async () => {
      const key = queryKey()
      TestBed.runInInjectionContext(() => {
        return injectQuery(() => ({
          queryKey: key,
          queryFn: () =>
            sleep(0).then(() => Promise.reject(new Error('Some error'))),
          throwOnError: true,
        }))
      })

      await expect(vi.runAllTimersAsync()).rejects.toThrow('Some error')
    })

    it('should throw when throwOnError function returns true', async () => {
      const key = queryKey()
      TestBed.runInInjectionContext(() => {
        return injectQuery(() => ({
          queryKey: key,
          queryFn: () =>
            sleep(0).then(() => Promise.reject(new Error('Some error'))),
          throwOnError: () => true,
        }))
      })

      await expect(vi.runAllTimersAsync()).rejects.toThrow('Some error')
    })
  })

  it('should render with required signal inputs', async () => {
    @Component({
      selector: 'app-fake',
      template: `{{ query.data() }}`,
    })
    class FakeComponent {
      name = input.required<string>()

      query = injectQuery(() => ({
        queryKey: ['fake', this.name()],
        queryFn: () => this.name(),
      }))
    }

    const fixture = TestBed.createComponent(FakeComponent)
    setSignalInputs(fixture.componentInstance, {
      name: 'signal-input-required-test',
    })

    fixture.detectChanges()
    await vi.advanceTimersByTimeAsync(0)

    expect(fixture.componentInstance.query.data()).toEqual(
      'signal-input-required-test',
    )
  })

  describe('isRestoring', () => {
    it('should not fetch for the duration of the restoring period when isRestoring is true', async () => {
      const key = queryKey()
      const queryFn = vi
        .fn()
        .mockImplementation(() => sleep(10).then(() => 'data'))

      TestBed.configureTestingModule({
        providers: [provideIsRestoring(signal(true).asReadonly())],
      })

      const query = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: key,
          queryFn,
        })),
      )

      await vi.advanceTimersByTimeAsync(0)
      expect(query.status()).toBe('pending')
      expect(query.fetchStatus()).toBe('idle')
      expect(query.data()).toBeUndefined()
      expect(queryFn).toHaveBeenCalledTimes(0)

      await vi.advanceTimersByTimeAsync(10)
      expect(query.status()).toBe('pending')
      expect(query.fetchStatus()).toBe('idle')
      expect(query.data()).toBeUndefined()
      expect(queryFn).toHaveBeenCalledTimes(0)
    })
  })

  describe('injection context', () => {
    it('should throw NG0203 with descriptive error outside injection context', () => {
      const key = queryKey()
      expect(() => {
        injectQuery(() => ({
          queryKey: key,
          queryFn: () => sleep(0).then(() => 'Some data'),
        }))
      }).toThrow(/NG0203(.*?)injectQuery/)
    })

    it('should be usable outside injection context when passing an injector', () => {
      const key = queryKey()
      const query = injectQuery(
        () => ({
          queryKey: key,
          queryFn: () => sleep(0).then(() => 'Some data'),
        }),
        {
          injector: TestBed.inject(Injector),
        },
      )

      expect(query.status()).toBe('pending')
    })

    it('should complete queries before whenStable() resolves', async () => {
      const key = queryKey()
      const app = TestBed.inject(ApplicationRef)

      const query = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: key,
          queryFn: () => sleep(50).then(() => 'test data'),
        })),
      )

      expect(query.status()).toBe('pending')
      expect(query.data()).toBeUndefined()

      const stablePromise = app.whenStable()
      await vi.advanceTimersByTimeAsync(60)
      await stablePromise

      expect(query.status()).toBe('success')
      expect(query.data()).toBe('test data')
    })

    it('should complete HttpClient-based queries before whenStable() resolves', async () => {
      TestBed.configureTestingModule({
        providers: [provideHttpClient(), provideHttpClientTesting()],
      })

      const app = TestBed.inject(ApplicationRef)
      const httpClient = TestBed.inject(HttpClient)
      const httpTestingController = TestBed.inject(HttpTestingController)

      // Create a query using HttpClient
      const key = queryKey()
      const query = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: key,
          queryFn: () =>
            lastValueFrom(httpClient.get<{ message: string }>('/api/test')),
        })),
      )

      // Schedule the HTTP response
      setTimeout(() => {
        const req = httpTestingController.expectOne('/api/test')
        req.flush({ message: 'http test data' })
      }, 10)

      // Initial state
      expect(query.status()).toBe('pending')

      // Advance timers and wait for Angular to be "stable"
      const stablePromise = app.whenStable()
      await vi.advanceTimersByTimeAsync(20)
      await stablePromise

      // Query should be complete after whenStable() thanks to PendingTasks integration
      expect(query.status()).toBe('success')
      expect(query.data()).toEqual({ message: 'http test data' })

      httpTestingController.verify()
    })

    it('should handle synchronous queryFn with staleTime', async () => {
      const app = TestBed.inject(ApplicationRef)
      let callCount = 0

      const key = queryKey()
      const query = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: key,
          staleTime: 1000,
          queryFn: () => {
            callCount++
            return `sync-data-${callCount}`
          },
        })),
      )

      // Synchronize pending effects
      TestBed.tick()

      const stablePromise = app.whenStable()
      await stablePromise

      expect(query.status()).toBe('success')
      expect(query.data()).toBe('sync-data-1')
      expect(callCount).toBe(1)

      await query.refetch()
      await Promise.resolve()
      await vi.runAllTimersAsync()
      await app.whenStable()

      expect(query.status()).toBe('success')
      expect(query.data()).toBe('sync-data-2')
      expect(callCount).toBe(2)
    })

    it('should handle enabled/disabled transitions with synchronous queryFn', async () => {
      const app = TestBed.inject(ApplicationRef)
      const enabledSignal = signal(false)
      let callCount = 0

      const key = queryKey()
      const query = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: key,
          enabled: enabledSignal(),
          queryFn: () => {
            callCount++
            return `sync-data-${callCount}`
          },
        })),
      )

      // Initially disabled
      TestBed.tick()
      await app.whenStable()
      expect(query.status()).toBe('pending')
      expect(query.data()).toBeUndefined()
      expect(callCount).toBe(0)

      // Enable the query
      enabledSignal.set(true)
      TestBed.tick()

      await app.whenStable()
      expect(query.status()).toBe('success')
      expect(query.data()).toBe('sync-data-1')
      expect(callCount).toBe(1)
    })

    it('should handle query invalidation with synchronous data', async () => {
      const app = TestBed.inject(ApplicationRef)
      const testKey = queryKey()
      let callCount = 0

      const query = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: testKey,
          queryFn: () => {
            callCount++
            return `sync-data-${callCount}`
          },
        })),
      )

      // Synchronize pending effects
      TestBed.tick()

      await app.whenStable()
      expect(query.status()).toBe('success')
      expect(query.data()).toBe('sync-data-1')
      expect(callCount).toBe(1)

      // Invalidate the query
      queryClient.invalidateQueries({ queryKey: testKey })
      TestBed.tick()

      // Wait for the invalidation to trigger a refetch
      await Promise.resolve()
      await vi.advanceTimersByTimeAsync(10)
      TestBed.tick()

      await app.whenStable()
      expect(query.status()).toBe('success')
      expect(query.data()).toBe('sync-data-2')
      expect(callCount).toBe(2)
    })
  })

  describe('skipToken', () => {
    it('should not fetch when queryFn is skipToken, and fetch once it is replaced', async () => {
      const key = queryKey()
      const queryFn = vi.fn(() => sleep(10).then(() => 'post 1'))

      @Component({
        template: `
          <div>status: {{ query.status() }}</div>
          <div>isFetching: {{ query.isFetching() }}</div>
          <div>data: {{ query.data() ?? 'none' }}</div>
        `,
      })
      class Page {
        postId = signal<string | undefined>(undefined)

        readonly query = injectQuery(() => ({
          queryKey: [...key, this.postId()],
          queryFn: this.postId() != null ? queryFn : skipToken,
        }))
      }

      const rendered = await render(Page)

      expect(rendered.getByText('status: pending')).toBeInTheDocument()
      expect(rendered.getByText('isFetching: false')).toBeInTheDocument()

      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()
      expect(queryFn).not.toHaveBeenCalled()
      expect(rendered.getByText('status: pending')).toBeInTheDocument()
      expect(rendered.getByText('isFetching: false')).toBeInTheDocument()

      rendered.fixture.componentInstance.postId.set('1')
      rendered.fixture.detectChanges()
      expect(rendered.getByText('isFetching: true')).toBeInTheDocument()

      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()
      expect(queryFn).toHaveBeenCalledTimes(1)
      expect(rendered.getByText('status: success')).toBeInTheDocument()
      expect(rendered.getByText('data: post 1')).toBeInTheDocument()
    })
  })
})
