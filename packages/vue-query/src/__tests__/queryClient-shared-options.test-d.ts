import { describe, expectTypeOf, it } from 'vitest'
import { QueryClient } from '../queryClient'
import type { UseQueryOptions } from '../queryOptions'

describe('QueryClient with shared UseQueryOptions', () => {
  it('accepts options at the imperative query entry points', () => {
    const options: UseQueryOptions<string> = {
      queryKey: ['shared'],
      queryFn: () => Promise.resolve('value'),
    }
    const client = new QueryClient()

    // eslint-disable-next-line no-restricted-syntax -- regression coverage for the deprecated API
    expectTypeOf(client.ensureQueryData(options)).toEqualTypeOf<
      Promise<string>
    >()
    // eslint-disable-next-line no-restricted-syntax -- regression coverage for the deprecated API
    expectTypeOf(client.fetchQuery(options)).toEqualTypeOf<Promise<string>>()
    // eslint-disable-next-line no-restricted-syntax -- regression coverage for the deprecated API
    expectTypeOf(client.prefetchQuery(options)).toEqualTypeOf<Promise<void>>()
    expectTypeOf(client.query(options)).toEqualTypeOf<Promise<string>>()
  })
})

describe('selected shared options', () => {
  it('only applies select to query(), not the deprecated fetch wrappers', () => {
    const options: UseQueryOptions<number, Error, string> = {
      queryKey: () => ['selected'],
      queryFn: () => Promise.resolve(2),
      select: (value) => String(value),
    }
    const client = new QueryClient()

    expectTypeOf(client.query(options)).toEqualTypeOf<Promise<string>>()
    // eslint-disable-next-line no-restricted-syntax -- regression coverage for the deprecated API
    expectTypeOf(client.ensureQueryData(options)).toEqualTypeOf<
      Promise<number>
    >()
    // eslint-disable-next-line no-restricted-syntax -- regression coverage for the deprecated API
    expectTypeOf(client.fetchQuery(options)).toEqualTypeOf<Promise<number>>()
    // eslint-disable-next-line no-restricted-syntax -- regression coverage for the deprecated API
    expectTypeOf(client.prefetchQuery(options)).toEqualTypeOf<Promise<void>>()
  })
})

describe('cache data with a different queryFn type', () => {
  it('returns cached data from the deprecated fetch wrappers', () => {
    const options: UseQueryOptions<number, Error, boolean, string> = {
      queryKey: ['cached'],
      queryFn: () => Promise.resolve(2),
      select: (value) => value.length > 0,
    }
    const client = new QueryClient()

    expectTypeOf(client.query(options)).toEqualTypeOf<Promise<boolean>>()
    // eslint-disable-next-line no-restricted-syntax -- regression coverage for the deprecated API
    expectTypeOf(client.ensureQueryData(options)).toEqualTypeOf<
      Promise<string>
    >()
    // eslint-disable-next-line no-restricted-syntax -- regression coverage for the deprecated API
    expectTypeOf(client.fetchQuery(options)).toEqualTypeOf<Promise<string>>()
    // eslint-disable-next-line no-restricted-syntax -- regression coverage for the deprecated API
    expectTypeOf(client.prefetchQuery(options)).toEqualTypeOf<Promise<void>>()
  })
})
