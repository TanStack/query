import { LitElement } from 'lit'
import { describe, expectTypeOf, it } from 'vitest'
import { useIsFetching } from '../useIsFetching.js'

class Host extends LitElement {}

describe('useIsFetching', () => {
  it('should accept filters without fetchStatus', () => {
    const host = new Host()

    expectTypeOf(useIsFetching(host)()).toEqualTypeOf<number>()
    expectTypeOf(
      useIsFetching(host, { queryKey: ['key'], exact: true })(),
    ).toEqualTypeOf<number>()
    expectTypeOf(
      useIsFetching(host, () => ({ queryKey: ['key'] }))(),
    ).toEqualTypeOf<number>()
  })

  it('should reject a fetchStatus filter', () => {
    const host = new Host()

    expectTypeOf(
      // @ts-expect-error useIsFetching always filters by fetchStatus: 'fetching'
      useIsFetching(host, { queryKey: ['key'], fetchStatus: 'paused' })(),
    ).toEqualTypeOf<number>()
  })
})
