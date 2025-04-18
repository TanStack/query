import { describe, expectTypeOf, it } from 'vitest'
import { dataTagSymbol } from '@tanstack/query-core'
import { mutationOptions } from '../mutationOptions'

describe('mutationOptions', () => {
  it('should not allow excess properties', () => {
    return mutationOptions({
      mutationFn: () => Promise.resolve(5),
      mutationKey: ['key'],
      // @ts-expect-error this is a good error, because onMutates does not exist!
      onMutates: 1000,
    })
  })

  it('should infer types for callbacks', () => {
    return mutationOptions({
      mutationFn: () => Promise.resolve(5),
      mutationKey: ['key'],
      onSuccess: (data) => {
        expectTypeOf(data).toEqualTypeOf<number>()
      },
    })
  })

  it('should tag the mutationKey with the result type of the MutationFn', () => {
    const { mutationKey } = mutationOptions({
      mutationKey: ['key'],
      mutationFn: () => Promise.resolve(5),
    })

    expectTypeOf(mutationKey[dataTagSymbol]).toEqualTypeOf<number>()
  })

  it('should tag the mutationKey with unknown if there is no mutationFn', () => {
    const { mutationKey } = mutationOptions({
      mutationKey: ['key'],
    })

    expectTypeOf(mutationKey[dataTagSymbol]).toEqualTypeOf<unknown>()
  })

  it('should tag the mutationKey with the result type of the MutationFn if onSuccess is used', () => {
    const { mutationKey } = mutationOptions({
      mutationKey: ['key'],
      mutationFn: () => Promise.resolve(5),
      onSuccess: () => {},
    })

    expectTypeOf(mutationKey[dataTagSymbol]).toEqualTypeOf<number>()
  })
})
