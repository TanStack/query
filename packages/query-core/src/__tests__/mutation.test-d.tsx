import { describe, expectTypeOf, it } from 'vitest'
import type { DefaultError, MutateFunction, MutateOptions } from 'src/types'

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

  it('required non-undefinable variables', () => {
    const mutate = {} as MutateFunction<unknown, DefaultError, number, unknown>

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
