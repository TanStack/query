import {
  Component,
  Injector,
  input,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { By } from '@angular/platform-browser'
import { sleep } from '@tanstack/query-test-utils'
import {
  QueryClient,
  injectMutation,
  injectMutationState,
  provideTanStackQuery,
} from '..'
import { setFixtureSignalInputs } from './test-utils'

describe('injectMutationState', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    vi.useFakeTimers()
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

  describe('injectMutationState', () => {
    test('should return variables after calling mutate 1', () => {
      const mutationKey = ['mutation']
      const variables = 'foo123'

      const mutation = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationKey: mutationKey,
          mutationFn: (params: string) => sleep(0).then(() => params),
        }))
      })

      mutation.mutate(variables)

      const mutationState = TestBed.runInInjectionContext(() => {
        return injectMutationState(() => ({
          filters: { mutationKey, status: 'pending' },
          select: (m) => m.state.variables,
        }))
      })

      expect(mutationState()).toEqual([variables])
    })

    test('reactive options should update injectMutationState', () => {
      const mutationKey1 = ['mutation1']
      const mutationKey2 = ['mutation2']
      const variables1 = 'foo123'
      const variables2 = 'bar234'

      const [mutation1, mutation2] = TestBed.runInInjectionContext(() => {
        return [
          injectMutation(() => ({
            mutationKey: mutationKey1,
            mutationFn: (params: string) => sleep(0).then(() => params),
          })),
          injectMutation(() => ({
            mutationKey: mutationKey2,
            mutationFn: (params: string) => sleep(0).then(() => params),
          })),
        ]
      })

      mutation1.mutate(variables1)
      mutation2.mutate(variables2)

      const filterKey = signal(mutationKey1)

      const mutationState = TestBed.runInInjectionContext(() => {
        return injectMutationState(() => ({
          filters: { mutationKey: filterKey(), status: 'pending' },
          select: (m) => m.state.variables,
        }))
      })

      expect(mutationState()).toEqual([variables1])

      filterKey.set(mutationKey2)
      expect(mutationState()).toEqual([variables2])
    })

    test('should return variables after calling mutate 2', () => {
      queryClient.clear()
      const mutationKey = ['mutation']
      const variables = 'bar234'

      const mutation = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationKey: mutationKey,
          mutationFn: (params: string) => sleep(0).then(() => params),
        }))
      })

      mutation.mutate(variables)

      const mutationState = TestBed.runInInjectionContext(() => {
        return injectMutationState()
      })

      expect(mutationState()[0]?.variables).toEqual(variables)
    })

    test('should support required signal inputs', async () => {
      queryClient.clear()
      const fakeName = 'name1'
      const mutationKey1 = ['fake', fakeName]

      const mutations = TestBed.runInInjectionContext(() => {
        return [
          injectMutation(() => ({
            mutationKey: mutationKey1,
            mutationFn: () => Promise.resolve('myValue'),
          })),
          injectMutation(() => ({
            mutationKey: mutationKey1,
            mutationFn: () => Promise.reject('myValue2'),
          })),
        ]
      })

      mutations.forEach((mutation) => mutation.mutate())

      @Component({
        selector: 'app-fake',
        template: `
          @for (mutation of mutationState(); track $index) {
            <span>{{ mutation.status }}</span>
          }
        `,
        standalone: true,
      })
      class FakeComponent {
        name = input.required<string>()

        mutationState = injectMutationState(() => ({
          filters: {
            mutationKey: ['fake', this.name()],
            exact: true,
          },
        }))
      }

      const fixture = TestBed.createComponent(FakeComponent)
      const { debugElement } = fixture
      setFixtureSignalInputs(fixture, { name: fakeName })
      vi.advanceTimersByTime(0.1)

      let spans = debugElement
        .queryAll(By.css('span'))
        .map((span) => span.nativeNode.textContent)

      expect(spans).toEqual(['pending', 'pending'])

      await vi.runAllTimersAsync()
      fixture.detectChanges()

      spans = debugElement
        .queryAll(By.css('span'))
        .map((span) => span.nativeNode.textContent)

      expect(spans).toEqual(['success', 'error'])
    })

    describe('injection context', () => {
      test('throws NG0203 with descriptive error outside injection context', () => {
        expect(() => {
          injectMutationState()
        }).toThrowError(/NG0203(.*?)injectMutationState/)
      })

      test('can be used outside injection context when passing an injector', () => {
        const injector = TestBed.inject(Injector)
        expect(
          injectMutationState(undefined, {
            injector,
          }),
        ).not.toThrow()
      })
    })
  })
})
