import { describe, expectTypeOf, it } from 'vitest'
import type { DistributiveOmit, OmitKeyof } from '..'

describe('OmitKeyof', () => {
  it('should omit a string key and reject one the object does not have', () => {
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

  it('should omit a number key and reject one the object does not have', () => {
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

  it('should omit a symbol key and reject one the object does not have', () => {
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

  it('should default TStrictly to strictly', () => {
    type A = {
      x: string
      y: number
    }

    // the two-argument form must behave exactly like the explicit 'strictly' form
    expectTypeOf<OmitKeyof<A, 'y'>>().toEqualTypeOf<
      OmitKeyof<A, 'y', 'strictly'>
    >()

    // and it must reject an unknown key just like 'strictly' does
    expectTypeOf<
      OmitKeyof<
        A,
        // @ts-expect-error Type does not satisfy the constraint keyof A
        'z'
      >
    >().toEqualTypeOf<A>()
  })

  it('should constrain TStrictly to strictly or safely', () => {
    type A = {
      x: string
      y: number
    }

    expectTypeOf<OmitKeyof<A, 'y', 'safely'>>().toEqualTypeOf<{ x: string }>()

    expectTypeOf<
      OmitKeyof<
        A,
        'y',
        // @ts-expect-error 'loosely' is not a valid TStrictly
        'loosely'
      >
    >().toEqualTypeOf<{ x: string }>()
  })

  it('should accept an arbitrary key only with safely, never with strictly', () => {
    type A = {
      x: string
      y: number
    }

    // 'safely' widens the constraint so an unrelated key is accepted and simply ignored
    expectTypeOf<OmitKeyof<A, 'z', 'safely'>>().toEqualTypeOf<A>()
    expectTypeOf<OmitKeyof<A, 3, 'safely'>>().toEqualTypeOf<A>()

    // while 'strictly' rejects the very same key
    expectTypeOf<
      OmitKeyof<
        A,
        // @ts-expect-error Type does not satisfy the constraint keyof A
        'z',
        'strictly'
      >
    >().toEqualTypeOf<A>()
  })

  it('should preserve optional and readonly modifiers', () => {
    type A = {
      readonly x: string
      y?: number
      readonly z?: boolean
    }

    expectTypeOf<OmitKeyof<A, 'y'>>().toEqualTypeOf<{
      readonly x: string
      readonly z?: boolean
    }>()

    expectTypeOf<OmitKeyof<A, 'z'>>().toEqualTypeOf<{
      readonly x: string
      y?: number
    }>()
  })

  it('should collapse a union instead of distributing over it', () => {
    type A = { kind: 'a'; shared: string; onlyA: number }
    type B = { kind: 'b'; shared: string; onlyB: boolean }

    // `keyof (A | B)` is the intersection of the keys, so only the common keys
    // satisfy the 'strictly' constraint
    expectTypeOf<OmitKeyof<A | B, 'shared'>>().toEqualTypeOf<{
      kind: 'a' | 'b'
    }>()

    // a key that only exists on one member is rejected by 'strictly'
    expectTypeOf<
      OmitKeyof<
        A | B,
        // @ts-expect-error 'onlyA' is not in keyof (A | B)
        'onlyA'
      >
    >().toEqualTypeOf<{ kind: 'a' | 'b'; shared: string }>()
  })

  it('should accept every key of an index signature', () => {
    type A = Record<string, number>

    // `keyof Record<string, number>` is `string | number`, so 'strictly'
    // accepts an arbitrary key here even though nothing is removed
    expectTypeOf<OmitKeyof<A, 'anything'>>().toEqualTypeOf<{
      [x: string]: number
    }>()

    expectTypeOf<OmitKeyof<A, string>>().toEqualTypeOf<{}>()
  })

  it('should omit every key when TKey is keyof TObject', () => {
    type A = {
      x: string
      y: number
    }

    expectTypeOf<OmitKeyof<A, keyof A>>().toEqualTypeOf<{}>()
    expectTypeOf<OmitKeyof<A, never>>().toEqualTypeOf<A>()
  })
})

describe('DistributiveOmit', () => {
  it('should distribute over a union instead of collapsing it, unlike OmitKeyof', () => {
    type A = { kind: 'a'; shared: string; onlyA: number }
    type B = { kind: 'b'; shared: string; onlyB: boolean }

    // each union member is omitted from separately, so the member-only keys survive
    expectTypeOf<DistributiveOmit<A | B, 'shared'>>().toEqualTypeOf<
      { kind: 'a'; onlyA: number } | { kind: 'b'; onlyB: boolean }
    >()

    // whereas OmitKeyof collapses the union into its common keys
    expectTypeOf<OmitKeyof<A | B, 'shared'>>().toEqualTypeOf<{
      kind: 'a' | 'b'
    }>()
  })

  it('should constrain TKey to the keys shared by every union member', () => {
    type A = { kind: 'a'; shared: string; onlyA: number }
    type B = { kind: 'b'; shared: string; onlyB: boolean }

    // a key that only exists on one member is rejected, because the constraint
    // is `keyof TObject` on the union itself rather than on each distributed arm
    expectTypeOf<
      DistributiveOmit<
        A | B,
        // @ts-expect-error 'onlyA' is not in keyof (A | B)
        'onlyA'
      >['kind']
    >().toEqualTypeOf<'a' | 'b'>()

    // the key shared by every member is accepted
    expectTypeOf<DistributiveOmit<A | B, 'kind'>>().toEqualTypeOf<
      { shared: string; onlyA: number } | { shared: string; onlyB: boolean }
    >()
  })

  it('should behave like Omit on a non-union object', () => {
    type A = {
      x: string
      y: number
    }

    expectTypeOf<DistributiveOmit<A, 'y'>>().toEqualTypeOf<{ x: string }>()
  })
})
