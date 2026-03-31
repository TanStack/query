import { describe, expectTypeOf, it } from 'vitest'
import type { OmitKeyof } from '..'

describe('OmitKeyof', () => {
  it("'s string key type check", () => {
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
    >().toEqualTypeOf<ExpectedType>()
    expectTypeOf<
      OmitKeyof<
        A,
        // OmitKeyof can't use 'z' as type parameter with type error because A don't have key 'z'
        // @ts-expect-error Type does not satisfy the constraint keyof A
        'z' | 'y',
        'strictly'
      >
    >().toEqualTypeOf<ExpectedType>()

    // 2. safely
    expectTypeOf<
      OmitKeyof<
        A,
        // OmitKeyof can't use 'z' as type parameter type error with strictly parameter or default parameter
        // @ts-expect-error Type does not satisfy the constraint keyof A
        'z' | 'y'
      >
    >().toEqualTypeOf<ExpectedType>()
    expectTypeOf<
      OmitKeyof<
        A,
        // With 'safely', OmitKeyof can use 'z' as type parameter like original Omit but This support autocomplete too yet for DX.
        'z' | 'y',
        'safely'
      >
    >().toEqualTypeOf<ExpectedType>()
  })

  it("'s number key type check", () => {
    type A = {
      [1]: string
      [2]: number
    }

    type ExpectedType = {
      [1]: string
    }

    // Bad point
    // 1. original Omit can use 3 as type parameter with no type error
    // 2. original Omit have no auto complete for 2nd type parameter
    expectTypeOf<Omit<A, 3 | 2>>().toEqualTypeOf<ExpectedType>()

    // Solution

    // 1. strictly
    expectTypeOf<
      OmitKeyof<
        A,
        // OmitKeyof can't use 3 as type parameter with type error because A don't have key 3
        // @ts-expect-error Type does not satisfy the constraint keyof A
        3 | 2
      >
    >().toEqualTypeOf<ExpectedType>()
    expectTypeOf<
      OmitKeyof<
        A,
        // OmitKeyof can't use 3 as type parameter with type error because A don't have key 3
        // @ts-expect-error Type does not satisfy the constraint keyof A
        3 | 2,
        'strictly'
      >
    >().toEqualTypeOf<ExpectedType>()

    // 2. safely
    expectTypeOf<
      OmitKeyof<
        A,
        // OmitKeyof can't use 3 as type parameter type error with strictly parameter or default parameter
        // @ts-expect-error Type does not satisfy the constraint keyof A
        3 | 2
      >
    >().toEqualTypeOf<ExpectedType>()
    expectTypeOf<
      OmitKeyof<
        A,
        // With 'safely', OmitKeyof can use 3 as type parameter like original Omit but This support autocomplete too yet for DX.
        3 | 2,
        'safely'
      >
    >().toEqualTypeOf<ExpectedType>()
  })

  it("'s symbol key type check", () => {
    const symbol1 = Symbol()
    const symbol2 = Symbol()
    const symbol3 = Symbol()

    type A = {
      [symbol1]: string
      [symbol2]: number
    }

    type ExpectedType = {
      [symbol1]: string
    }

    // Bad point
    // 1. original Omit can use symbol3 as type parameter with no type error
    // 2. original Omit have no auto complete for 2nd type parameter
    expectTypeOf<
      Omit<A, typeof symbol3 | typeof symbol2>
    >().toEqualTypeOf<ExpectedType>()

    // Solution

    // 1. strictly
    expectTypeOf<
      OmitKeyof<
        A,
        // OmitKeyof can't use symbol3 as type parameter with type error because A don't have key symbol3
        // @ts-expect-error Type does not satisfy the constraint keyof A
        typeof symbol3 | typeof symbol2
      >
    >().toEqualTypeOf<ExpectedType>()
    expectTypeOf<
      OmitKeyof<
        A,
        // OmitKeyof can't use symbol3 as type parameter with type error because A don't have key symbol3
        // @ts-expect-error Type does not satisfy the constraint keyof A
        typeof symbol3 | typeof symbol2,
        'strictly'
      >
    >().toEqualTypeOf<ExpectedType>()

    // 2. safely
    expectTypeOf<
      OmitKeyof<
        A,
        // OmitKeyof can't use symbol3 as type parameter type error with strictly parameter or default parameter
        // @ts-expect-error Type does not satisfy the constraint keyof A
        typeof symbol3 | typeof symbol2
      >
    >().toEqualTypeOf<ExpectedType>()
    expectTypeOf<
      OmitKeyof<
        A,
        // With 'safely', OmitKeyof can use symbol3 as type parameter like original Omit but This support autocomplete too yet for DX.
        typeof symbol3 | typeof symbol2,
        'safely'
      >
    >().toEqualTypeOf<ExpectedType>()
  })
})
