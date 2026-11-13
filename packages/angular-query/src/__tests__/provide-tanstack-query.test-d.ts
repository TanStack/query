import { describe, expectTypeOf, it } from 'vitest'
import {
  QueryClient,
  provideTanStackQuery,
  withHydrationKey,
  withNoQueryHydration,
} from '..'
import type { QueryFeature } from '..'
import type * as PublicApi from '..'
import type * as InternalApi from '../internal'

describe('provideTanStackQuery', () => {
  it('keeps integration helpers out of the public entry point', () => {
    type InternalHelpers =
      | 'queryFeature'
      | 'getQueryFeatureProviders'
      | 'provideIsRestoring'
    expectTypeOf<Extract<keyof typeof PublicApi, InternalHelpers>>().toBeNever()
    expectTypeOf<
      Extract<keyof typeof InternalApi, InternalHelpers>
    >().toEqualTypeOf<InternalHelpers>()
  })

  it('accepts built-in opaque query features', () => {
    expectTypeOf(withHydrationKey('cache')).toEqualTypeOf<QueryFeature>()
    expectTypeOf(withNoQueryHydration()).toEqualTypeOf<QueryFeature>()

    provideTanStackQuery(
      () => new QueryClient(),
      withHydrationKey('cache'),
      withNoQueryHydration(),
    )
  })

  it('rejects structurally fabricated features', () => {
    expectTypeOf(withHydrationKey('cache')).toEqualTypeOf<QueryFeature>()

    provideTanStackQuery(
      () => new QueryClient(),
      // @ts-expect-error QueryFeature values can only be created by package features
      { ɵkind: 'Hydration', ɵproviders: {} },
    )
  })
})
