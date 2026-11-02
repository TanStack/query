import { describe, expectTypeOf, it } from 'vitest'
import { ref } from 'vue-demi'
import { useIsFetching } from '../useIsFetching'

describe('useIsFetching', () => {
  it('should accept filters without fetchStatus', () => {
    expectTypeOf(useIsFetching().value).toEqualTypeOf<number>()
    expectTypeOf(
      useIsFetching({ queryKey: ['key'], exact: true }).value,
    ).toEqualTypeOf<number>()
  })

  it('should accept reactive filters without fetchStatus', () => {
    expectTypeOf(
      useIsFetching(ref({ queryKey: ['key'] })).value,
    ).toEqualTypeOf<number>()
    expectTypeOf(
      useIsFetching(() => ({ queryKey: ['key'] })).value,
    ).toEqualTypeOf<number>()
  })

  it('should reject a fetchStatus filter', () => {
    expectTypeOf(
      // @ts-expect-error useIsFetching always filters by fetchStatus: 'fetching'
      useIsFetching({ queryKey: ['key'], fetchStatus: 'paused' }).value,
    ).toEqualTypeOf<number>()
    expectTypeOf(
      // @ts-expect-error useIsFetching always filters by fetchStatus: 'fetching'
      useIsFetching(() => ({ fetchStatus: 'paused' })).value,
    ).toEqualTypeOf<number>()
  })
})
