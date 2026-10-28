import { describe, expectTypeOf, it } from 'vitest'
import { useIsFetching } from '../../src/index.js'

describe('useIsFetching', () => {
  it('should accept filters without fetchStatus', () => {
    expectTypeOf(useIsFetching().current).toEqualTypeOf<number>()
    expectTypeOf(
      useIsFetching({ queryKey: ['key'], exact: true }).current,
    ).toEqualTypeOf<number>()
  })

  it('should reject a fetchStatus filter', () => {
    expectTypeOf(
      // @ts-expect-error useIsFetching always filters by fetchStatus: 'fetching'
      useIsFetching({ queryKey: ['key'], fetchStatus: 'paused' }).current,
    ).toEqualTypeOf<number>()
  })
})
