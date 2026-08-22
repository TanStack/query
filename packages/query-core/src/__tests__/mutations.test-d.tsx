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

  it('unknown variables', () => {
    const mutate = {} as MutateFunction<unknown, DefaultError, unknown, unknown>

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
        undefined | MutateOptions<unknown, DefaultError, void | string, unknown>
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
