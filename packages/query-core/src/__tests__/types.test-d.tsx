import { describe, expectTypeOf, it } from 'vitest'
import type { MutateFunction } from 'src/types'

describe('MutateFunction', () => {
  it('optional undefinable variables', () => {
    const mutate = {} as MutateFunction<
      unknown,
      unknown,
      number | undefined,
      unknown
    >

    expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<
      number | undefined
    >()

    mutate() // can be called with no arguments
  })

  it('required non-undefinable variables', () => {
    const mutate = {} as MutateFunction<unknown, unknown, number, unknown>

    expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<number>()

    // @ts-expect-error --- required variables
    mutate()
  })

  describe('compatible with spread arguments pattern', () => {
    // this is common pattern used internal so we need make sure it still works

    it('optional undefinable variables', () => {
      const mutate = {} as (
        ...options: Parameters<
          MutateFunction<unknown, unknown, number | undefined, unknown>
        >
      ) => void

      expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<
        number | undefined
      >()

      mutate() // can be called with no arguments
    })

    it('required non-undefinable variables', () => {
      const mutate = {} as (
        ...options: Parameters<
          MutateFunction<unknown, unknown, number, unknown>
        >
      ) => void

      expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<number>()

      // @ts-expect-error --- required variables
      mutate()
    })
  })
})
