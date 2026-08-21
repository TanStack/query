import { describe, expectTypeOf, it } from 'vitest'
import { QueryClient } from '../queryClient'
import { MutationObserver } from '../mutationObserver'

describe('mutation', () => {
  describe('onMutate', () => {
    it('should have onMutateResult undefined if undefined is explicitly returned', () => {
      new MutationObserver(new QueryClient(), {
        mutationFn: (variables: number) => {
          return Promise.resolve(String(variables))
        },
        onMutate: () => {
          return undefined
        },
        onSuccess: (data, variables, onMutateResult) => {
          expectTypeOf(data).toEqualTypeOf<string>()
          expectTypeOf(variables).toEqualTypeOf<number>()
          expectTypeOf(onMutateResult).toEqualTypeOf<undefined>()
        },
        onError: (_data, _variables, onMutateResult) => {
          expectTypeOf(onMutateResult).toEqualTypeOf<undefined>()
        },
        onSettled: (_data, _error, _variables, onMutateResult) => {
          expectTypeOf(onMutateResult).toEqualTypeOf<undefined>()
        },
      })
    })

    it('should have unknown onMutateResult if onMutate is left out', () => {
      new MutationObserver(new QueryClient(), {
        mutationFn: (variables: number) => {
          return Promise.resolve(String(variables))
        },
        onSuccess: (_data, _variables, onMutateResult) => {
          expectTypeOf(onMutateResult).toEqualTypeOf<unknown>()
        },
        onError: (_data, _variables, onMutateResult) => {
          expectTypeOf(onMutateResult).toEqualTypeOf<unknown>()
        },
        onSettled: (_data, _error, _variables, onMutateResult) => {
          expectTypeOf(onMutateResult).toEqualTypeOf<unknown>()
        },
      })
    })

    it('should infer onMutateResult', () => {
      new MutationObserver(new QueryClient(), {
        mutationFn: (variables: number) => {
          return Promise.resolve(String(variables))
        },
        onMutate: () => {
          return Promise.resolve({ foo: 'bar' })
        },
        onSuccess: (_data, _variables, onMutateResult) => {
          expectTypeOf(onMutateResult).toEqualTypeOf<{ foo: string }>()
        },
        onError: (_data, _variables, onMutateResult) => {
          expectTypeOf(onMutateResult).toEqualTypeOf<
            { foo: string } | undefined
          >()
        },
        onSettled: (_data, _error, _variables, onMutateResult) => {
          expectTypeOf(onMutateResult).toEqualTypeOf<
            { foo: string } | undefined
          >()
        },
      })
    })

    it('should include undefined in the union if explicitly returned', () => {
      new MutationObserver(new QueryClient(), {
        mutationFn: (variables: number) => {
          return Promise.resolve(String(variables))
        },
        onMutate: () => {
          return Math.random() > 0.5 ? { foo: 'bar' } : undefined
        },
        onSuccess: (_data, _variables, onMutateResult) => {
          expectTypeOf(onMutateResult).toEqualTypeOf<
            { foo: string } | undefined
          >()
        },
        onError: (_data, _variables, onMutateResult) => {
          expectTypeOf(onMutateResult).toEqualTypeOf<
            { foo: string } | undefined
          >()
        },
        onSettled: (_data, _error, _variables, onMutateResult) => {
          expectTypeOf(onMutateResult).toEqualTypeOf<
            { foo: string } | undefined
          >()
        },
      })
    })
  })
})
