import { provideZonelessChangeDetection, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { QueryClient, injectQuery, provideTanStackQuery } from '..'
import { PENDING_TASKS } from '../pending-tasks-compat'

describe('pending tasks integration', () => {
  let queryClient: QueryClient
  let events: Array<string>
  let readData: () => unknown

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
    events = []
    readData = () => undefined
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(queryClient),
        {
          provide: PENDING_TASKS,
          useValue: {
            add: () => {
              events.push('add')
              return () => events.push(`release:${String(readData())}`)
            },
          },
        },
      ],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('holds a pending task from fetch start until the result is applied', async () => {
    const key = queryKey()
    const query = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'ok'),
      })),
    )
    readData = () => query.data()
    TestBed.tick()

    // Registered synchronously with the fetch, not one notifyManager schedule turn later. With
    // zoneless change detection that turn is invisible to `ApplicationRef.whenStable()`, so SSR
    // could serialize inside it.
    expect(events).toEqual(['add'])

    await vi.advanceTimersByTimeAsync(11)

    // Released only after the result was written to the signal: releasing first exposes one
    // synchronous statement in which the app is stable while the rendered view is still stale.
    expect(events).toEqual(['add', 'release:ok'])
    expect(query.data()).toBe('ok')
  })

  it('registers the task in the same tick a dependent query becomes enabled', async () => {
    const key = queryKey()
    const enabled = signal(false)
    const query = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: key,
        enabled: enabled(),
        queryFn: () => sleep(10).then(() => 'ok'),
      })),
    )
    readData = () => query.data()
    TestBed.tick()
    expect(events).toEqual([])

    enabled.set(true)
    TestBed.tick()
    expect(events).toEqual(['add'])

    await vi.advanceTimersByTimeAsync(11)
    expect(events).toEqual(['add', 'release:ok'])
  })

  it('registers the task when refetch() starts a fetch', async () => {
    const key = queryKey()
    const query = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'ok'),
      })),
    )
    readData = () => query.data()
    TestBed.tick()
    await vi.advanceTimersByTimeAsync(11)
    expect(events).toEqual(['add', 'release:ok'])
    events.length = 0

    void query.refetch()

    // Registered synchronously with the refetch, not one notifyManager schedule turn later
    expect(events).toEqual(['add'])

    await vi.advanceTimersByTimeAsync(11)
    expect(events).toEqual(['add', 'release:ok'])
  })

  it('releases the task when the query errors', async () => {
    const key = queryKey()
    const query = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: key,
        retry: false,
        queryFn: () => sleep(10).then(() => Promise.reject(new Error('boom'))),
      })),
    )
    readData = () => query.data()
    TestBed.tick()
    expect(events).toEqual(['add'])

    await vi.advanceTimersByTimeAsync(11)
    expect(events).toEqual(['add', 'release:undefined'])
    expect(query.status()).toBe('error')
  })
})
