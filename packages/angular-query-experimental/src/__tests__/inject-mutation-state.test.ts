import { Component, Injector, input, signal } from '@angular/core'
import { QueryClient } from '@tanstack/query-core'
import { TestBed } from '@angular/core/testing'
// NOTE: do not import test from 'vitest' here - only global test function is patched for Angular zone
import { describe, expect, vi } from 'vitest'
import { By } from '@angular/platform-browser'
import { JsonPipe } from '@angular/common'
import { injectMutation } from '../inject-mutation'
import { injectMutationState } from '../inject-mutation-state'
import { provideAngularQuery } from '../providers'
import { setFixtureSignalInputs, successMutator } from './test-utils'

const MUTATION_DURATION = 1000

const resolveMutations = () => vi.advanceTimersByTimeAsync(MUTATION_DURATION)

describe('injectMutationState', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    vi.useFakeTimers()
    TestBed.configureTestingModule({
      providers: [provideAngularQuery(queryClient)],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('injectMutationState', () => {
    test('should return variables after calling mutate', async () => {
      const mutationKey = ['mutation']
      const variables = 'foo123'

      const mutation = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationKey: mutationKey,
          mutationFn: (params: string) => successMutator(params),
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

    test('reactive options should update injectMutationState', async () => {
      const mutationKey1 = ['mutation1']
      const mutationKey2 = ['mutation2']
      const variables1 = 'foo123'
      const variables2 = 'bar234'

      const [mutation1, mutation2] = TestBed.runInInjectionContext(() => {
        return [
          injectMutation(() => ({
            mutationKey: mutationKey1,
            mutationFn: (params: string) => successMutator(params),
          })),
          injectMutation(() => ({
            mutationKey: mutationKey2,
            mutationFn: (params: string) => successMutator(params),
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
      TestBed.flushEffects()
      expect(mutationState()).toEqual([variables2])
    })

    test('should return variables after calling mutate', async () => {
      queryClient.clear()
      const mutationKey = ['mutation']
      const variables = 'bar234'

      const mutation = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationKey: mutationKey,
          mutationFn: (params: string) => successMutator(params),
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
          @for (mutation of mutationState(); track mutation) {
            <span>{{ mutation.status }}</span>
          }
        `,
        standalone: true,
        imports: [JsonPipe],
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

      fixture.detectChanges()

      let spans = debugElement
        .queryAll(By.css('span'))
        .map((span) => span.nativeNode.textContent)

      expect(spans).toEqual(['pending', 'pending'])

      await resolveMutations()
      fixture.detectChanges()

      spans = debugElement
        .queryAll(By.css('span'))
        .map((span) => span.nativeNode.textContent)

      expect(spans).toEqual(['success', 'error'])
    })

    describe('injection context', () => {
      test('throws NG0203 outside injection context', () => {
        expect(() => {
          injectMutationState()
        }).toThrowError(
          'NG0203: injectMutationState() can only be used within an injection context such as a constructor, a factory function, a field initializer, or a function used with `runInInjectionContext`. Find more at https://angular.io/errors/NG0203',
        )
      })

      test('can be used outside injection context when passing an injector', () => {
        expect(
          injectMutationState(undefined, TestBed.inject(Injector)),
        ).not.toThrow()
      })
    })
  })
})
