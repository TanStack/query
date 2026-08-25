import { describe, expectTypeOf, it } from 'vitest'
import { QueryClient } from '../queryClient'
import { MutationObserver } from '../mutationObserver'
import type { DefaultError, MutateFunction, MutateOptions } from '../types'

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

  describe('MutateFunction', () => {
    it('void variables', () => {
      const mutate = {} as MutateFunction

      expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<
        undefined | void
      >()

      expectTypeOf<Parameters<typeof mutate>[1]>().toEqualTypeOf<
        undefined | MutateOptions<unknown, DefaultError, void, unknown>
      >()

      mutate() // can be called with no arguments
      mutate(undefined, {
        onError: (e) => {
          expectTypeOf(e).toEqualTypeOf<DefaultError>()
        },
      })
    })

    it('optional undefinable variables', () => {
      const mutate = {} as MutateFunction<
        unknown,
        DefaultError,
        number | undefined,
        unknown
      >

      expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<
        number | undefined
      >()

      expectTypeOf<Parameters<typeof mutate>[1]>().toEqualTypeOf<
        | undefined
        | MutateOptions<unknown, DefaultError, number | undefined, unknown>
      >()

      mutate() // can be called with no arguments
      mutate(undefined, {
        onError: (e) => {
          expectTypeOf(e).toEqualTypeOf<DefaultError>()
        },
      })
    })

    it('unknown variables', () => {
      const mutate = {} as MutateFunction<
        unknown,
        DefaultError,
        unknown,
        unknown
      >

      expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<unknown>()

      expectTypeOf<Parameters<typeof mutate>[1]>().toEqualTypeOf<
        undefined | MutateOptions<unknown, DefaultError, unknown, unknown>
      >()

      mutate() // can be called with no arguments
    })

    it('any variables', () => {
      const mutate = {} as MutateFunction<unknown, DefaultError, any, unknown>

      expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<any>()

      expectTypeOf<Parameters<typeof mutate>[1]>().toEqualTypeOf<
        undefined | MutateOptions<unknown, DefaultError, any, unknown>
      >()

      mutate() // can be called with no arguments
    })

    it('void union variables', () => {
      const mutate = {} as MutateFunction<
        unknown,
        DefaultError,
        void | string,
        unknown
      >

      expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<
        void | string | undefined
      >()

      expectTypeOf<Parameters<typeof mutate>[1]>().toEqualTypeOf<
        undefined | MutateOptions<unknown, DefaultError, void | string, unknown>
      >()

      mutate() // can be called with no arguments
    })

    it('required non-undefinable variables', () => {
      const mutate = {} as MutateFunction<
        unknown,
        DefaultError,
        number,
        unknown
      >

      expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<number>()

      expectTypeOf<Parameters<typeof mutate>[1]>().toEqualTypeOf<
        undefined | MutateOptions<unknown, DefaultError, number, unknown>
      >()

      // @ts-expect-error --- required variables
      mutate()
      mutate(123, {
        onError: (e) => {
          expectTypeOf(e).toEqualTypeOf<DefaultError>()
        },
      })
    })

    describe('compatible with spread arguments pattern', () => {
      // this is common pattern used internal so we need make sure it still works

      it('void variables', () => {
        const mutate = {} as (...options: Parameters<MutateFunction>) => void

        expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<
          undefined | void
        >()

        expectTypeOf<Parameters<typeof mutate>[1]>().toEqualTypeOf<
          undefined | MutateOptions<unknown, DefaultError, void, unknown>
        >()

        mutate() // can be called with no arguments
        mutate(undefined, {
          onError: (e) => {
            expectTypeOf(e).toEqualTypeOf<DefaultError>()
          },
        })
      })

      it('optional undefinable variables', () => {
        const mutate = {} as (
          ...options: Parameters<
            MutateFunction<unknown, DefaultError, number | undefined, unknown>
          >
        ) => void

        expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<
          number | undefined
        >()

        expectTypeOf<Parameters<typeof mutate>[1]>().toEqualTypeOf<
          | undefined
          | MutateOptions<unknown, DefaultError, number | undefined, unknown>
        >()

        mutate() // can be called with no arguments
        mutate(undefined, {
          onError: (e) => {
            expectTypeOf(e).toEqualTypeOf<DefaultError>()
          },
        })
      })

      it('unknown variables', () => {
        const mutate = {} as (
          ...options: Parameters<
            MutateFunction<unknown, DefaultError, unknown, unknown>
          >
        ) => void

        expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<unknown>()

        expectTypeOf<Parameters<typeof mutate>[1]>().toEqualTypeOf<
          undefined | MutateOptions<unknown, DefaultError, unknown, unknown>
        >()

        mutate() // can be called with no arguments
      })

      it('any variables', () => {
        const mutate = {} as (
          ...options: Parameters<
            MutateFunction<unknown, DefaultError, any, unknown>
          >
        ) => void

        expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<any>()

        expectTypeOf<Parameters<typeof mutate>[1]>().toEqualTypeOf<
          undefined | MutateOptions<unknown, DefaultError, any, unknown>
        >()

        mutate() // can be called with no arguments
      })

      it('void union variables', () => {
        const mutate = {} as (
          ...options: Parameters<
            MutateFunction<unknown, DefaultError, void | string, unknown>
          >
        ) => void

        expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<
          void | string | undefined
        >()

        expectTypeOf<Parameters<typeof mutate>[1]>().toEqualTypeOf<
          | undefined
          | MutateOptions<unknown, DefaultError, void | string, unknown>
        >()

        mutate() // can be called with no arguments
      })

      it('required non-undefinable variables', () => {
        const mutate = {} as (
          ...options: Parameters<
            MutateFunction<unknown, DefaultError, number, unknown>
          >
        ) => void

        expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<number>()

        expectTypeOf<Parameters<typeof mutate>[1]>().toEqualTypeOf<
          undefined | MutateOptions<unknown, DefaultError, number, unknown>
        >()

        // @ts-expect-error --- required variables
        mutate()
        mutate(123, {
          onError: (e) => {
            expectTypeOf(e).toEqualTypeOf<DefaultError>()
          },
        })
      })
    })
  })
})
