import { describe, expectTypeOf, it } from 'vitest'
import { mutationOptions } from '../mutationOptions'
import type { CoreMutationOptions } from '../index'

describe('mutationOptions', () => {
  it('should infer mutation data and variables', () => {
    const options = mutationOptions({
      mutationFn: (variables: { id: string }) => Promise.resolve(variables.id),
      onSuccess: (data, variables) => {
        expectTypeOf(data).toEqualTypeOf<string>()
        expectTypeOf(variables).toEqualTypeOf<{ id: string }>()
      },
    })

    expectTypeOf(options.mutationFn)
      .parameter(0)
      .toEqualTypeOf<{ id: string }>()
    type MutationFn = NonNullable<typeof options.mutationFn>
    expectTypeOf<Awaited<ReturnType<MutationFn>>>().toEqualTypeOf<string>()
    expectTypeOf(options).not.toHaveProperty('mutationKey')
  })

  it('should preserve a required mutationKey', () => {
    const options = mutationOptions({
      mutationKey: ['key'],
      mutationFn: (variables: { id: string }) => Promise.resolve(variables.id),
    })

    expectTypeOf(options.mutationKey).toEqualTypeOf<ReadonlyArray<unknown>>()
  })

  it('should export the reusable mutation options type', () => {
    expectTypeOf<
      CoreMutationOptions<string, Error, { id: string }>
    >().toHaveProperty('mutationFn')
  })

  it('should not allow _defaulted', () => {
    expectTypeOf(mutationOptions).parameter(0).not.toHaveProperty('_defaulted')

    mutationOptions({
      mutationFn: () => Promise.resolve(5),
      // @ts-expect-error _defaulted is an internal option
      _defaulted: true,
    })
  })
})
