import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/angular'
import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  Injector,
  computed,
  effect,
  input,
  signal,
} from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { sleep } from '@tanstack/query-test-utils'
import { queryKey } from '@tanstack/query-test-utils'
import { QueryClient, provideIsRestoring } from '..'
import { injectQueries } from '../inject-queries'
import { registerSignalInput, setupTanStackQueryTestBed } from './test-utils'

let queryClient: QueryClient

beforeEach(() => {
  queryClient = new QueryClient()
  vi.useFakeTimers({ shouldAdvanceTime: true })
  setupTanStackQueryTestBed(queryClient)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('injectQueries', () => {
  it('throws NG0203 with descriptive error outside injection context', () => {
    expect(() => {
      injectQueries(() => ({
        queries: [
          {
            queryKey: ['injectionContextError'],
            queryFn: () => Promise.resolve(1),
          },
        ],
      }))
    }).toThrowError(/NG0203(.*?)injectQueries/)
  })

  it('can be used outside injection context when passing an injector', () => {
    const injector = TestBed.inject(Injector)
    const queries = injectQueries(
      () => ({
        queries: [
          {
            queryKey: ['manualInjector'],
            queryFn: () => Promise.resolve(1),
          },
        ],
      }),
      injector,
    )

    expect(queries()[0].status()).toBe('pending')
  })

  it('should return the correct states', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const results: Array<Array<Record<string, any>>> = []

    @Component({
      template: `
        <div>
          <div>
            data1: {{ queries()[0].data() ?? 'null' }}, data2:
            {{ queries()[1].data() ?? 'null' }}
          </div>
        </div>
      `,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      toString(val: any) {
        return String(val)
      }
      queries = injectQueries(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: async () => {
              await new Promise((r) => setTimeout(r, 10))
              return 1
            },
          },
          {
            queryKey: key2,
            queryFn: async () => {
              await new Promise((r) => setTimeout(r, 100))
              return 2
            },
          },
        ],
      }))

      _pushResults = effect(() => {
        const snapshot = this.queries().map((q) => ({ data: q.data() }))
        results.push(snapshot)
      })
    }

    const rendered = await render(Page)

    await rendered.findByText('data1: 1, data2: 2')

    expect(results.length).toBe(3)
    expect(results[0]).toMatchObject([{ data: undefined }, { data: undefined }])
    expect(results[1]).toMatchObject([{ data: 1 }, { data: undefined }])
    expect(results[2]).toMatchObject([{ data: 1 }, { data: 2 }])
  })

  it('should support combining results', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    let count = 0

    const results: Array<{ data: string; refetch: () => void }> = []

    @Component({
      template: ` <div>data: {{ queries().data }}</div> `,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      queries = injectQueries(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: async () => {
              await new Promise((r) => setTimeout(r, 10))
              count++
              return count
            },
          },
          {
            queryKey: key2,
            queryFn: async () => {
              await new Promise((r) => setTimeout(r, 100))
              count++
              return count
            },
          },
        ],
        combine: (results) => {
          return {
            refetch: () => results.forEach((r) => r.refetch()),
            data: results.map((r) => r.data).join(','),
          }
        },
      }))

      _pushResults = effect(() => {
        results.push(this.queries())
      })
    }

    const rendered = await render(Page)
    const instance = rendered.fixture.componentInstance
    await rendered.findByText('data: 1,2')
    expect(instance.queries().data).toBe('1,2')

    instance.queries().refetch()

    await rendered.findByText('data: 3,4')
    expect(instance.queries().data).toBe('3,4')

    expect(results).toHaveLength(5)
    expect(results[0]).toMatchObject({
      data: ',',
      refetch: expect.any(Function),
    })
    expect(results[1]).toMatchObject({
      data: '1,',
      refetch: expect.any(Function),
    })
    expect(results[2]).toMatchObject({
      data: '1,2',
      refetch: expect.any(Function),
    })
    expect(results[3]).toMatchObject({
      data: '3,2',
      refetch: expect.any(Function),
    })
    expect(results[4]).toMatchObject({
      data: '3,4',
      refetch: expect.any(Function),
    })
  })

  it('should handle mixed success and error query states', async () => {
    @Component({
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      queries = injectQueries(() => ({
        queries: [
          {
            queryKey: ['mixed-error'],
            retry: false,
            queryFn: async () => {
              await new Promise((resolve) => setTimeout(resolve, 10))
              throw new Error('mixed-error')
            },
          },
          {
            queryKey: ['mixed-success'],
            queryFn: async () => {
              await new Promise((resolve) => setTimeout(resolve, 20))
              return 'mixed-success'
            },
          },
        ],
      }))
    }

    const rendered = await render(Page)
    await vi.advanceTimersByTimeAsync(25)
    await Promise.resolve()

    const [errorQuery, successQuery] = rendered.fixture.componentInstance.queries()
    expect(errorQuery.status()).toBe('error')
    expect(errorQuery.error()?.message).toBe('mixed-error')
    expect(successQuery.status()).toBe('success')
    expect(successQuery.data()).toBe('mixed-success')
  })

  it('should cleanup pending tasks when component with active queries is destroyed', async () => {
    @Component({
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      queries = injectQueries(() => ({
        queries: [
          {
            queryKey: ['destroy-query-1'],
            queryFn: async () => {
              await sleep(100)
              return 'one'
            },
          },
          {
            queryKey: ['destroy-query-2'],
            queryFn: async () => {
              await sleep(100)
              return 'two'
            },
          },
        ],
      }))
    }

    // Use a fixture here on purpose: we need component teardown + whenStable() semantics.
    const fixture = TestBed.createComponent(Page)
    fixture.detectChanges()
    expect(fixture.isStable()).toBe(false)

    fixture.destroy()

    const stablePromise = fixture.whenStable()
    await vi.advanceTimersByTimeAsync(150)
    await stablePromise

    expect(fixture.isStable()).toBe(true)
  })

  it('should react to enabled signal changes', async () => {
    const enabled = signal(false)
    const fetchSpy = vi.fn(() => sleep(10).then(() => 'enabled-data'))

    @Component({
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      enabled = enabled
      fetchSpy = fetchSpy

      queries = injectQueries(() => ({
        queries: [
          {
            queryKey: ['enabled', this.enabled()],
            queryFn: this.fetchSpy,
            enabled: this.enabled(),
          },
        ],
      }))
    }

    const rendered = await render(Page)
    const query = rendered.fixture.componentInstance.queries()[0]

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(query.status()).toBe('pending')

    enabled.set(true)
    rendered.fixture.detectChanges()
    await vi.advanceTimersByTimeAsync(11)
    await Promise.resolve()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(query.status()).toBe('success')
    expect(query.data()).toBe('enabled-data')
  })

  it('should refetch only changed keys when queries length stays the same', async () => {
    const ids = signal<[string, string]>(['a', 'b'])
    const firstSpy = vi.fn((context: any) =>
      sleep(10).then(() => `first-${context.queryKey[1]}`),
    )
    const secondSpy = vi.fn((context: any) =>
      sleep(10).then(() => `second-${context.queryKey[1]}`),
    )

    @Component({
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      ids = ids
      firstSpy = firstSpy
      secondSpy = secondSpy

      queries = injectQueries(() => ({
        queries: [
          {
            staleTime: Number.POSITIVE_INFINITY,
            queryKey: ['first', this.ids()[0]],
            queryFn: this.firstSpy,
          },
          {
            staleTime: Number.POSITIVE_INFINITY,
            queryKey: ['second', this.ids()[1]],
            queryFn: this.secondSpy,
          },
        ],
      }))
    }

    const rendered = await render(Page)
    await vi.advanceTimersByTimeAsync(11)
    await Promise.resolve()

    let [firstQuery, secondQuery] = rendered.fixture.componentInstance.queries()
    expect(firstQuery.data()).toBe('first-a')
    expect(secondQuery.data()).toBe('second-b')
    expect(firstSpy).toHaveBeenCalledTimes(1)
    expect(secondSpy).toHaveBeenCalledTimes(1)

    ids.set(['c', 'b'])
    rendered.fixture.detectChanges()
    await vi.advanceTimersByTimeAsync(11)
    await Promise.resolve()

    ;[firstQuery, secondQuery] = rendered.fixture.componentInstance.queries()
    expect(firstQuery.data()).toBe('first-c')
    expect(secondQuery.data()).toBe('second-b')
    expect(firstSpy).toHaveBeenCalledTimes(2)
    expect(secondSpy).toHaveBeenCalledTimes(1)
  })

  it('should support changes on the queries array', async () => {
    const results: Array<Array<Record<string, any>>> = []

    @Component({
      template: ` <div>data: {{ mapped() }}</div> `,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      queries = injectQueries(() => ({
        queries: queries().map((q) => ({
          queryKey: ['query', q],
          queryFn: async () => {
            await new Promise((resolve) => setTimeout(resolve, 20 * q))
            return q
          },
        })),
      }))

      mapped = computed(() => {
        const results = this.queries().map((q) => q.data())
        if (results.length === 0) return 'empty'
        return results.join(',')
      })

      _pushResults = effect(() => {
        const snapshot = this.queries().map((q) => ({ data: q.data() }))
        results.push(snapshot)
      })
    }

    const queries = signal([1, 2, 4])

    const rendered = await render(Page)
    const instance = rendered.fixture.componentInstance

    await rendered.findByText('data: 1,2,4')
    expect(instance.mapped()).toBe('1,2,4')

    expect(results.length).toBe(4)
    expect(results[0]).toMatchObject([
      { data: undefined },
      { data: undefined },
      { data: undefined },
    ])
    expect(results[1]).toMatchObject([
      { data: 1 },
      { data: undefined },
      { data: undefined },
    ])
    expect(results[2]).toMatchObject([
      { data: 1 },
      { data: 2 },
      { data: undefined },
    ])
    expect(results[3]).toMatchObject([{ data: 1 }, { data: 2 }, { data: 4 }])

    queries.set([3, 4])
    await rendered.findByText('data: 3,4')
    expect(instance.mapped()).toBe('3,4')

    const hasOptimisticTransition = results.some(
      (snapshot) =>
        snapshot.length === 2 &&
        snapshot[0]?.data === undefined &&
        snapshot[1]?.data === 4,
    )
    expect(hasOptimisticTransition).toBe(true)
    expect(results[results.length - 1]).toMatchObject([{ data: 3 }, { data: 4 }])

    queries.set([])
    await rendered.findByText('data: empty')
    expect(instance.mapped()).toBe('empty')

    expect(results[results.length - 1]).toMatchObject([])
  })

  it('should change the rendered component when the queries array changes', async () => {
    const userIds = signal([1, 2])

    @Component({
      template: `
        <ul>
          @for (query of queries(); track $index) {
            @if (query.data(); as data) {
              <li>{{ data.value }}</li>
            }
          }
        </ul>
      `,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      userIds = userIds

      queries = injectQueries(() => ({
        queries: this.userIds().map((id) => ({
          queryKey: ['user', id],
          queryFn: async () => {
            await new Promise((resolve) => setTimeout(resolve, 20))
            return { value: String(id) }
          },
        })),
      }))
    }

    const rendered = await render(Page)

    await rendered.findByText('1')
    await rendered.findByText('2')

    userIds.set([3])
    rendered.fixture.detectChanges()

    await rendered.findByText('3')
    expect(rendered.queryByText('1')).toBeNull()
    expect(rendered.queryByText('2')).toBeNull()
  })

  it('should support required signal inputs', async () => {
    @Component({
      selector: 'app-fake',
      template: `{{ queries()[0].data() }}`,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class FakeComponent {
      name = input.required<string>()

      queries = injectQueries(() => ({
        queries: [
          {
            queryKey: ['fake', this.name()],
            queryFn: () => this.name(),
          },
        ],
      }))
    }

    registerSignalInput(FakeComponent, 'name')

    @Component({
      template: `<app-fake [name]="name()" />`,
      imports: [FakeComponent],
    })
    class HostComponent {
      protected readonly name = signal('signal-input-required-test')
    }

    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()
    await vi.advanceTimersByTimeAsync(0)

    const result = fixture.nativeElement.querySelector('app-fake').textContent
    expect(result).toEqual('signal-input-required-test')
  })

  it('should pause fetching while restoring and fetch once restoring is disabled', async () => {
    const isRestoring = signal(true)
    const fetchSpy = vi.fn(() => sleep(10).then(() => 'restored-data'))
    setupTanStackQueryTestBed(queryClient, {
      providers: [provideIsRestoring(isRestoring.asReadonly())],
    })

    @Component({
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      queries = injectQueries(() => ({
        queries: [
          {
            queryKey: ['restoring'],
            queryFn: fetchSpy,
          },
        ],
      }))
    }

    const fixture = TestBed.createComponent(Page)
    fixture.detectChanges()

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(fixture.componentInstance.queries()[0].status()).toBe('pending')

    const stablePromise = fixture.whenStable()
    await Promise.resolve()
    await stablePromise

    isRestoring.set(false)
    fixture.detectChanges()

    await vi.advanceTimersByTimeAsync(11)
    await fixture.whenStable()

    const result = fixture.componentInstance.queries()[0]
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(result.status()).toBe('success')
    expect(result.data()).toBe('restored-data')
  })

  it('should complete queries before whenStable resolves', async () => {
    const app = TestBed.inject(ApplicationRef)

    @Component({
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      queries = injectQueries(() => ({
        queries: [
          {
            queryKey: ['query-1'],
            queryFn: async () => {
              await new Promise((resolve) => setTimeout(resolve, 10))
              return 1
            },
          },
          {
            queryKey: ['query-2'],
            queryFn: async () => {
              await new Promise((resolve) => setTimeout(resolve, 20))
              return 2
            },
          },
        ],
      }))
    }

    const fixture = TestBed.createComponent(Page)
    fixture.detectChanges()

    const stablePromise = app.whenStable()
    let stableResolved = false
    void stablePromise.then(() => {
      stableResolved = true
    })

    await Promise.resolve()
    expect(stableResolved).toBe(false)

    await vi.advanceTimersByTimeAsync(25)
    await stablePromise

    const result = fixture.componentInstance.queries()
    expect(result[0].status()).toBe('success')
    expect(result[1].status()).toBe('success')
    expect(result[0].data()).toBe(1)
    expect(result[1].data()).toBe(2)
  })

  it('should use latest query key for aliased refetch function', async () => {
    const key = signal('one')
    const fetchSpy = vi.fn(async (context: any) => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      return context.queryKey[1]
    })

    @Component({
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Page {
      key = key
      fetchSpy = fetchSpy

      queries = injectQueries(() => ({
        queries: [
          {
            queryKey: ['query', this.key()],
            queryFn: this.fetchSpy,
            enabled: false,
          },
        ],
      }))
    }

    const rendered = await render(Page)
    const query = rendered.fixture.componentInstance.queries()[0]
    const refetch = query.refetch

    key.set('two')
    rendered.fixture.detectChanges()

    const refetchPromise = refetch()
    await vi.advanceTimersByTimeAsync(15)
    await refetchPromise

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['query', 'two'],
      }),
    )
  })
})
