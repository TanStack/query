import { assertType, describe, expectTypeOf, test } from 'vitest'
import { mutationOptions } from '../mutation-options'

describe('mutationOptions', () => {
  test('should not allow excess properties', () => {
    assertType<Parameters<typeof mutationOptions>>([
      {
        mutationFn: () => Promise.resolve(5),
        mutationKey: ['key'],
        // @ts-expect-error this is a good error, because onMutates does not exist!
        onMutates: 1000,
      },
    ])
    assertType<Parameters<typeof mutationOptions>>([
      {
        mutationFn: () => Promise.resolve(5),
        mutationKey: ['key'],
        // @ts-expect-error this is a good error, because onMutates does not exist!
        onMutates: 1000,
      },
    ])
  })

  test('should infer types for callbacks', () => {
    mutationOptions({
      mutationFn: () => Promise.resolve(5),
      mutationKey: ['key'],
      onSuccess: (data) => {
        expectTypeOf(data).toEqualTypeOf<number>()
      },
    })
  })
})
