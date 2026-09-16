import {
  ChangeDetectionStrategy,
  Component,
  input,
  inputBinding,
  signal,
} from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { render } from '@testing-library/angular'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sleep } from '@tanstack/query-test-utils'
import {
  QueryClient,
  injectMutation,
  injectMutationState,
  provideTanStackQuery,
} from '..'
import { provideAngularQueryChangeDetection } from './test-utils'

describe('injectMutationState', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    vi.useFakeTimers()
    TestBed.configureTestingModule({
      providers: [
        provideAngularQueryChangeDetection(),
        provideTanStackQuery(() => queryClient),
      ],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('publishes selected mutation values unchanged and compares snapshot entries by identity', () => {
    const version = signal('before')
    queryClient.getMutationCache().build(queryClient, { mutationKey: ['a'] })
    queryClient.getMutationCache().build(queryClient, { mutationKey: ['b'] })
    let selected: Array<{ value: string }> = []
    const states = TestBed.runInInjectionContext(() =>
      injectMutationState(() => {
        selected = []
        return {
          select: (m) => {
            const value = {
              value:
                m.options.mutationKey![0] === 'a' ? version() : 'unchanged',
            }
            selected.push(value)
            return value
          },
        }
      }),
    )
    const before = states()
    version.set('after')
    const after = states()
    expect(after[0]).toBe(selected[0])
    expect(after[1]).toBe(selected[1])
    expect(after[1]).not.toBe(before[1])
    // Stable entries avoid array-only updates, without deep comparison.
    const filter = signal('a')
    const selectedValue = { value: 'same' }
    const filtered = TestBed.runInInjectionContext(() =>
      injectMutationState(() => ({
        filters: { mutationKey: [filter()] },
        select: () => selectedValue,
      })),
    )
    const initial = filtered()
    filter.set('b')
    expect(filtered()).toBe(initial)
    expect(filtered()[0]).toBe(selectedValue)
  })

  describe('injectMutationState', () => {
    it('should return variables after calling mutate 1', () => {
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

    it('reactive options should update injectMutationState', () => {
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

    it('preserves result identity when an unrelated mutation changes', () => {
      const mutationState = TestBed.runInInjectionContext(() =>
        injectMutationState(() => ({
          filters: { mutationKey: ['matching'] },
        })),
      )
      const unrelatedMutation = TestBed.runInInjectionContext(() =>
        injectMutation(() => ({
          mutationKey: ['unrelated'],
          mutationFn: () => Promise.resolve(),
        })),
      )
      const initialResult = mutationState()

      unrelatedMutation.mutate()

      expect(mutationState()).toBe(initialResult)
    })

    it('should return variables after calling mutate 2', () => {
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

    it('should support required signal inputs', async () => {
      queryClient.clear()
      const fakeName = 'name1'
      const mutationKey1 = ['fake', fakeName]

      const mutations = TestBed.runInInjectionContext(() => {
        return [
          injectMutation(() => ({
            mutationKey: mutationKey1,
            mutationFn: () => sleep(10).then(() => 'myValue'),
          })),
          injectMutation(() => ({
            mutationKey: mutationKey1,
            mutationFn: () =>
              sleep(10).then(() => Promise.reject(new Error('myValue2'))),
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
        changeDetection: ChangeDetectionStrategy.OnPush,
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

      TestBed.resetTestingModule()
      const name = signal(fakeName)
      const rendered = await render(FakeComponent, {
        providers: [
          provideAngularQueryChangeDetection(),
          provideTanStackQuery(() => queryClient),
        ],
        bindings: [inputBinding('name', name.asReadonly())],
        detectChangesOnRender: false,
      })
      rendered.fixture.detectChanges()

      await vi.advanceTimersByTimeAsync(0)

      expect(rendered.getAllByText('pending')).toHaveLength(2)

      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()

      expect(rendered.getByText('success')).toBeInTheDocument()
      expect(rendered.getByText('error')).toBeInTheDocument()
    })

    describe('injection context', () => {
      it('throws NG0203 with descriptive error outside injection context', () => {
        expect(() => {
          injectMutationState()
        }).toThrowError(/NG0203(.*?)injectMutationState/)
      })
    })
  })
})
