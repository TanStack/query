import { describe, expectTypeOf, it } from 'vitest'
import type { OmitKeyof } from '..'

describe('OmitKeyof', () => {
  it("'s type check", () => {
    type A = {
      x: string
      y: number
    }

    type ExpectedType = {
      x: string
    }

    // Bad point
    // 1. original Omit can use 'z' as type parameter with no type error
    // 2. original Omit have no auto complete for 2nd type parameter
    expectTypeOf<Omit<A, 'z' | 'y'>>().toEqualTypeOf<ExpectedType>()

    // Solution

    // 1. strictly
    expectTypeOf<
      OmitKeyof<
        A,
        // OmitKeyof can't use 'z' as type parameter with type error because A don't have key 'z'
        // @ts-expect-error Type does not satisfy the constraint keyof A
        'z' | 'y'
      >
    >().toEqualTypeOf<ExpectedType>
    expectTypeOf<
      OmitKeyof<
        A,
        // OmitKeyof can't use 'z' as type parameter with type error because A don't have key 'z'
        // @ts-expect-error Type does not satisfy the constraint keyof A
        'z' | 'y',
        'strictly'
      >
    >().toEqualTypeOf<ExpectedType>

    // 2. safely
    expectTypeOf<
      OmitKeyof<
        A,
        // OmitKeyof can't use 'z' as type parameter type error with strictly parameter or default parameter
        // @ts-expect-error Type does not satisfy the constraint keyof A
        'z' | 'y'
      >
    >().toEqualTypeOf<ExpectedType>
    expectTypeOf<
      OmitKeyof<
        A,
        // With 'safely', OmitKeyof can use 'z' as type parameter like original Omit but This support autocomplete too yet for DX.
        'z' | 'y',
        'safely'
      >
    >().toEqualTypeOf<ExpectedType>
  })
})
