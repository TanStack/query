import { describe } from 'vitest'
import { TestBed, fakeAsync, flush } from '@angular/core/testing'
import { Component, Injector, input, signal } from '@angular/core'
import { QueryCache, QueryClient, injectQueries, provideAngularQuery } from '..'
import { setSignalInputs, simpleFetcher } from './test-utils'

describe('injectQueries', () => {
  let queryCache: QueryCache
  let queryClient: QueryClient

  beforeEach(() => {
    queryCache = new QueryCache()
    queryClient = new QueryClient({ queryCache })
    TestBed.configureTestingModule({
      providers: [provideAngularQuery(queryClient)],
    })
  })

  test('should return the correct results states', fakeAsync(() => {
    const ids = [1, 2, 3]
    const query = TestBed.runInInjectionContext(() => {
      return injectQueries({
        queriesFn: () =>
          ids.map((id) => ({
            queryKey: ['post', id],
            queryFn: () =>
              new Promise((resolve) => {
                setTimeout(() => {
                  return resolve(id)
                }, 0)
              }),
          })),
      })
    })
    expect(query()[0]?.isPending).toBe(true)
    expect(query()[0]?.data).toBe(undefined)
    expect(query()[1]?.data).toBe(undefined)
    expect(query()[2]?.data).toBe(undefined)
    flush()
    expect(query()[0]?.isPending).toBe(false)
    expect(query()[0]?.data).toBe(1)
    expect(query()[1]?.data).toBe(2)
    expect(query()[2]?.data).toBe(3)
  }))

  test('should return the correct combined results states', fakeAsync(() => {
    const ids = [1, 2, 3]
    const query = TestBed.runInInjectionContext(() => {
      return injectQueries({
        queriesFn: () =>
          ids.map((id) => ({
            queryKey: ['post2', id],
            queryFn: () =>
              new Promise((resolve) => {
                setTimeout(() => {
                  return resolve(id)
                }, 0)
              }),
          })),
        combine: (results) => {
          return {
            data: results.map((result) => result.data),
            pending: results.some((result) => result.isPending),
          }
        },
      })
    })
    expect(query().data).toStrictEqual([undefined, undefined, undefined])
    expect(query().pending).toBe(true)
    flush()
    expect(query().data).toStrictEqual([1, 2, 3])
  }))

  test('should update query on options contained signal change', fakeAsync(() => {
    const key = signal(['key1', 'key2'])
    const spy = vi.fn(simpleFetcher)

    const query = TestBed.runInInjectionContext(() => {
      return injectQueries({
        queriesFn: () => [
          {
            queryKey: key(),
            queryFn: spy,
          },
        ],
      })
    })
    flush()
    expect(spy).toHaveBeenCalledTimes(1)

    expect(query()[0].status).toBe('success')

    key.set(['key3'])
    TestBed.flushEffects()

    expect(spy).toHaveBeenCalledTimes(2)
    // should call queryFn with context containing the new queryKey
    expect(spy).toBeCalledWith({
      meta: undefined,
      queryKey: ['key3'],
      signal: expect.anything(),
    })
    flush()
  }))

  test('should only run query once enabled signal is set to true', fakeAsync(() => {
    const spy = vi.fn(simpleFetcher)
    const enabled = signal(false)

    const query = TestBed.runInInjectionContext(() => {
      return injectQueries({
        queriesFn: () => [
          {
            queryKey: ['key4'],
            queryFn: spy,
            enabled: enabled(),
          },
        ],
      })
    })

    expect(spy).not.toHaveBeenCalled()
    expect(query()[0].status).toBe('pending')

    enabled.set(true)
    TestBed.flushEffects()
    flush()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(query()[0].status).toBe('success')
  }))

  test('should render with required signal inputs', fakeAsync(() => {
    @Component({
      selector: 'app-fake',
      template: `{{ query()[0].data }}`,
      standalone: true,
    })
    class FakeComponent {
      name = input.required<string>()

      query = injectQueries({
        queriesFn: () => [
          {
            queryKey: ['fake', this.name()],
            queryFn: () => Promise.resolve(this.name()),
          },
        ],
      })
    }

    const fixture = TestBed.createComponent(FakeComponent)
    setSignalInputs(fixture.componentInstance, {
      name: 'signal-input-required-test',
    })

    flush()
    fixture.detectChanges()

    expect(fixture.debugElement.nativeElement.textContent).toEqual(
      'signal-input-required-test',
    )
  }))

  describe('injection context', () => {
    test('throws NG0203 with descriptive error outside injection context', () => {
      expect(() => {
        injectQueries({
          queriesFn: () => [
            {
              queryKey: ['injectionContextError'],
              queryFn: simpleFetcher,
            },
          ],
        })
      }).toThrowError(/NG0203(.*?)injectQueries/)
    })

    test('can be used outside injection context when passing an injector', () => {
      const query = injectQueries(
        {
          queriesFn: () => [
            {
              queryKey: ['injectionContextError'],
              queryFn: simpleFetcher,
            },
          ],
        },
        TestBed.inject(Injector),
      )

      expect(query()[0].status).toBe('pending')
    })
  })
})
