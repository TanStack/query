// cspell:ignore zoneful
import {
  ApplicationRef,
  Component,
  NgZone,
  provideZoneChangeDetection,
  signal,
} from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { provideIsRestoring } from '../internal'
import {
  QueryClient,
  injectMutation,
  injectQueries,
  injectQuery,
  provideTanStackQuery,
} from '..'

/**
 * These tests deliberately provide Angular's zone-based scheduler directly.
 * They are run by vitest.zoneful.config.ts, whose setup also loads the Zone.js
 * testing patches. Keeping this small integration set separate avoids making
 * every signal assertion in the zoneless suite depend on Zone.js scheduling.
 */
describe('Zone.js notification integration', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    TestBed.configureTestingModule({
      providers: [
        provideZoneChangeDetection(),
        provideTanStackQuery(() => queryClient),
      ],
    })
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('keeps an injectQuery signal current after its subscription commits', () => {
    const key = ['zoneful-query']
    const query = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: key,
        enabled: false,
      })),
    )

    expect(query.data()).toBeUndefined()
    TestBed.tick()
    queryClient.setQueryData(key, 'updated')

    expect(query.data()).toBe('updated')
  })

  it('keeps injectQueries current after its subscription commits', () => {
    const key = ['zoneful-queries']
    const queries = TestBed.runInInjectionContext(() =>
      injectQueries(() => ({
        queries: [{ queryKey: key, enabled: false }],
      })),
    )

    expect(queries()[0].data()).toBeUndefined()
    TestBed.tick()
    queryClient.setQueryData(key, 'updated')

    expect(queries()[0].data()).toBe('updated')
  })

  it('makes committed query notifications visible inside mutation onMutate', async () => {
    const key = ['zoneful-optimistic']
    const query = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: key,
        enabled: false,
      })),
    )
    const seenInOnMutate: Array<string | undefined> = []
    const mutation = TestBed.runInInjectionContext(() =>
      injectMutation(() => ({
        mutationKey: ['zoneful-mutation'],
        mutationFn: async () => 'server',
        onMutate: () => {
          queryClient.setQueryData(key, 'optimistic')
          seenInOnMutate.push(query.data() as string | undefined)
        },
      })),
    )

    query.data()
    TestBed.tick()
    await mutation.mutateAsync()

    expect(seenInOnMutate).toEqual(['optimistic'])
  })

  it('uses the latest options when restoration ends in the same Zone.js turn', async () => {
    const isRestoring = signal(true)
    const key = signal('old')
    const queriedKeys: Array<string> = []

    TestBed.resetTestingModule()
    TestBed.configureTestingModule({
      providers: [
        provideZoneChangeDetection(),
        provideTanStackQuery(() => queryClient),
        provideIsRestoring(() => isRestoring.asReadonly()),
      ],
    })

    const query = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: ['zoneful-restoration', key()],
        queryFn: ({ queryKey }) => {
          const currentKey = queryKey[1] as string
          queriedKeys.push(currentKey)
          return Promise.resolve(currentKey)
        },
      })),
    )

    expect(query.status()).toBe('pending')
    key.set('new')
    isRestoring.set(false)
    TestBed.tick()
    await TestBed.inject(ApplicationRef).whenStable()

    expect(queriedKeys).toEqual(['new'])
    expect(query.data()).toBe('new')
    expect(
      queryClient
        .getQueryCache()
        .find({ queryKey: ['zoneful-restoration', 'new'] })
        ?.getObserversCount(),
    ).toBe(1)
  })

  it('completes dependent queries before application stability without manual effect flushing', async () => {
    @Component({ template: '{{ second.data() }}' })
    class Page {
      first = injectQuery(() => ({
        queryKey: ['zoneful-dependency-first'],
        queryFn: async () => 'ready',
      }))
      second = injectQuery(() => ({
        queryKey: ['zoneful-dependency-second'],
        enabled: this.first.isSuccess(),
        queryFn: async () => 'dependent data',
      }))
    }

    const fixture = TestBed.createComponent(Page)
    fixture.autoDetectChanges()
    await TestBed.inject(ApplicationRef).whenStable()
    expect(fixture.componentInstance.second.data()).toBe('dependent data')
  })
  it('renders outside-zone query, multi-query and mutation notifications automatically', async () => {
    @Component({
      template:
        '{{ query.data() }} / {{ queries()[0].data() }} / {{ mutation.status() }}',
    })
    class Page {
      query = injectQuery(() => ({
        queryKey: ['outside-single'],
        enabled: false,
      }))
      queries = injectQueries(() => ({
        queries: [{ queryKey: ['outside-multiple'], enabled: false }],
      }))
      mutation = injectMutation(() => ({ mutationFn: async () => 'done' }))
    }
    const fixture = TestBed.createComponent(Page)
    fixture.autoDetectChanges()
    await fixture.whenStable()
    const zone = TestBed.inject(NgZone)
    const promise = zone.runOutsideAngular(() => {
      queryClient.setQueryData(['outside-single'], 'single')
      queryClient.setQueryData(['outside-multiple'], 'multiple')
      return fixture.componentInstance.mutation.mutateAsync()
    })
    await promise
    await fixture.whenStable()
    expect(fixture.nativeElement.textContent).toBe(
      'single / multiple / success',
    )
  })
})
