import { describe, expectTypeOf, it } from 'vitest'
import { useIsFetching } from '../useIsFetching'

describe('useIsFetching', () => {
  it('should accept filters without fetchStatus', () => {
    expectTypeOf(useIsFetching()).toEqualTypeOf<number>()
    expectTypeOf(
      useIsFetching({ queryKey: ['key'], exact: true }),
    ).toEqualTypeOf<number>()
  })

  it('should reject a fetchStatus filter', () => {
    expectTypeOf(
      // @ts-expect-error useIsFetching always filters by fetchStatus: 'fetching'
      useIsFetching({ queryKey: ['key'], fetchStatus: 'paused' }),
    ).toEqualTypeOf<number>()
  })
})
