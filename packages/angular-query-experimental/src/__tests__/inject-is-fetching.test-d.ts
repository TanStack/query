import { describe, expectTypeOf, it } from 'vitest'
import { injectIsFetching } from '../inject-is-fetching'

describe('injectIsFetching', () => {
  it('should accept filters without fetchStatus', () => {
    expectTypeOf(injectIsFetching()()).toEqualTypeOf<number>()
    expectTypeOf(
      injectIsFetching({ queryKey: ['key'], exact: true })(),
    ).toEqualTypeOf<number>()
  })

  it('should reject a fetchStatus filter', () => {
    expectTypeOf(
      // @ts-expect-error injectIsFetching always filters by fetchStatus: 'fetching'
      injectIsFetching({ queryKey: ['key'], fetchStatus: 'paused' })(),
    ).toEqualTypeOf<number>()
  })
})
