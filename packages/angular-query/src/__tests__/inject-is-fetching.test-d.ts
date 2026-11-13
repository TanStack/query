import { describe, expectTypeOf, it } from 'vitest'
import { injectIsFetching } from '../inject-is-fetching'

describe('injectIsFetching', () => {
  it('should accept filters without fetchStatus', () => {
    expectTypeOf(injectIsFetching()()).toEqualTypeOf<number>()
    expectTypeOf(
      injectIsFetching(() => ({ queryKey: ['key'], exact: true }))(),
    ).toEqualTypeOf<number>()
  })

  it('should omit fetchStatus from the filter type', () => {
    expectTypeOf<
      ReturnType<NonNullable<Parameters<typeof injectIsFetching>[0]>>
    >().not.toHaveProperty('fetchStatus')
  })
})
