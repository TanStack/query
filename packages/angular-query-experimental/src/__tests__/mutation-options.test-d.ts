import { mutationOptions } from '../mutation-options'

describe('mutationOptions', () => {
  test('should not allow excess properties', () => {
    expectTypeOf(mutationOptions).parameter(0).not.toHaveProperty('onMutates')
  })

  test('should infer types for callbacks', () => {
    return mutationOptions({
      mutationFn: () => Promise.resolve(5),
      mutationKey: ['key'],
      onSuccess: (data) => {
        expectTypeOf(data).toEqualTypeOf<number>()
      },
    })
  })
})
