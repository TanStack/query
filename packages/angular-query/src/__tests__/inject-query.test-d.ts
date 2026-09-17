import { describe, expectTypeOf, it } from 'vitest'
import { sleep } from '@tanstack/query-test-utils'
import { injectQuery, queryOptions, toResource } from '..'
import type { CreateQueryOptions } from '..'
import type { Resource, Signal } from '@angular/core'

describe('initialData', () => {
  describe('Config object overload', () => {
    it('TData should always be defined when initialData is provided as an object', () => {
      const query = injectQuery(() => ({
        queryKey: ['key'],
        queryFn: () => ({ wow: true }),
        initialData: { wow: true },
      }))
      const resource = toResource(query)

      expectTypeOf(query.data).toEqualTypeOf<Signal<{ wow: boolean }>>()
      expectTypeOf(resource.value).toEqualTypeOf<Signal<{ wow: boolean }>>()
    })

    it('TData should be defined when passed through queryOptions', () => {
      const options = () =>
        queryOptions({
          queryKey: ['key'],
          queryFn: () => {
            return {
              wow: true,
            }
          },
          initialData: {
            wow: true,
          },
        })
      const { data } = injectQuery(options)

      expectTypeOf(data).toEqualTypeOf<Signal<{ wow: boolean }>>()
    })

    it('should support selection function with select', () => {
      const options = injectQuery(() => ({
        queryKey: ['key'],
        queryFn: () => '1',
        select: (data) => {
          expectTypeOf(data).toEqualTypeOf<string>()
          return parseInt(data)
        },
      }))
      expectTypeOf(options.data).toEqualTypeOf<Signal<number | undefined>>()
    })

    it('should be possible to define a different TData than TQueryFnData using select with queryOptions spread into useQuery', () => {
      const options = queryOptions({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(1),
      })

      const query = injectQuery(() => ({
        ...options,
        select: (data) => data > 1,
      }))

      expectTypeOf(query.data).toEqualTypeOf<Signal<boolean | undefined>>()
    })

    it('TData should always be defined when initialData is provided as a function which ALWAYS returns the data', () => {
      const { data } = injectQuery(() => ({
        queryKey: ['key'],
        queryFn: () => {
          return {
            wow: true,
          }
        },
        initialData: () => ({
          wow: true,
        }),
      }))

      expectTypeOf(data).toEqualTypeOf<Signal<{ wow: boolean }>>()
    })

    it('TData should have undefined in the union when initialData is NOT provided', () => {
      const { data } = injectQuery(() => ({
        queryKey: ['key'],
        queryFn: () => {
          return {
            wow: true,
          }
        },
      }))

      expectTypeOf(data).toEqualTypeOf<Signal<{ wow: boolean } | undefined>>()
    })

    it('TData should have undefined in the union when initialData is provided as a function which can return undefined', () => {
      const { data } = injectQuery(() => ({
        queryKey: ['key'],
        queryFn: () => {
          return {
            wow: true,
          }
        },
        initialData: () => undefined as { wow: boolean } | undefined,
      }))

      expectTypeOf(data).toEqualTypeOf<Signal<{ wow: boolean } | undefined>>()
    })

    it('TData should be narrowed after an isSuccess check when initialData is provided as a function which can return undefined', () => {
      const query = injectQuery(() => ({
        queryKey: ['key'],
        queryFn: () => {
          return {
            wow: true,
          }
        },
        initialData: () => undefined as { wow: boolean } | undefined,
      }))

      if (query.isSuccess()) {
        expectTypeOf(query.data).toEqualTypeOf<Signal<{ wow: boolean }>>()
      }
    })

    it('should keep data defined after an isError check when initialData is provided', () => {
      const query = injectQuery(() => ({
        queryKey: ['key'],
        queryFn: () => Promise.resolve('Some data'),
        initialData: 'initial data',
      }))

      if (query.isError()) {
        expectTypeOf(query.data).toEqualTypeOf<Signal<string>>()
      }
    })

    it('should make an isPending branch impossible when initialData is provided', () => {
      const query = injectQuery(() => ({
        queryKey: ['key'],
        queryFn: () => Promise.resolve('Some data'),
        initialData: 'initial data',
      }))

      if (query.isPending()) {
        expectTypeOf(query).toEqualTypeOf<never>()
      }
    })
  })

  describe('structuralSharing', () => {
    it('should be able to use structuralSharing with unknown types', () => {
      // https://github.com/TanStack/query/issues/6525#issuecomment-1938411343
      injectQuery(() => ({
        queryKey: ['key'],
        queryFn: () => 5,
        structuralSharing: (oldData, newData) => {
          expectTypeOf(oldData).toBeUnknown()
          expectTypeOf(newData).toBeUnknown()
          return newData
        },
      }))
    })
  })
})

describe('Discriminated union return type', () => {
  it('should expose status predicates as Angular signals', () => {
    const query = injectQuery(() => ({
      queryKey: ['key'],
      queryFn: () => sleep(0).then(() => 'Some data'),
    }))

    expectTypeOf(query.isSuccess).toMatchTypeOf<Signal<boolean>>()
    expectTypeOf(query.isError).toMatchTypeOf<Signal<boolean>>()
    expectTypeOf(query.isPending).toMatchTypeOf<Signal<boolean>>()
  })

  it('should expose an Angular resource view', () => {
    const query = injectQuery(() => ({
      queryKey: ['key'],
      queryFn: () => sleep(0).then(() => 'Some data'),
    }))

    const resource = toResource(query)
    expectTypeOf(resource).toMatchTypeOf<Resource<string | undefined>>()
    expectTypeOf(resource.reload).toBeCallableWith()

    // @ts-expect-error Resources are created explicitly with toResource.
    query.resource
  })

  it('data should be possibly undefined by default', () => {
    const query = injectQuery(() => ({
      queryKey: ['key'],
      queryFn: () => sleep(0).then(() => 'Some data'),
    }))

    expectTypeOf(query.data).toEqualTypeOf<Signal<string | undefined>>()
  })

  it('data should be defined when query is success', () => {
    const query = injectQuery(() => ({
      queryKey: ['key'],
      queryFn: () => sleep(0).then(() => 'Some data'),
    }))

    if (query.isSuccess()) {
      expectTypeOf(query.data).toEqualTypeOf<Signal<string>>()
      expectTypeOf(toResource(query).value).toEqualTypeOf<Signal<string>>()
    }
  })

  it('error should be null when query is success', () => {
    const query = injectQuery(() => ({
      queryKey: ['key'],
      queryFn: () => sleep(0).then(() => 'Some data'),
    }))

    if (query.isSuccess()) {
      expectTypeOf(query.error).toEqualTypeOf<Signal<null>>()
    }
  })

  it('data should be undefined when query is pending', () => {
    const query = injectQuery(() => ({
      queryKey: ['key'],
      queryFn: () => sleep(0).then(() => 'Some data'),
    }))

    if (query.isPending()) {
      expectTypeOf(query.data).toEqualTypeOf<Signal<undefined>>()
    }
  })

  it('error should be defined when query is error', () => {
    const query = injectQuery(() => ({
      queryKey: ['key'],
      queryFn: () => sleep(0).then(() => 'Some data'),
    }))

    if (query.isError()) {
      expectTypeOf(query.error).toEqualTypeOf<Signal<Error>>()
    }
  })
})

describe('injectQuery options', () => {
  it('omits observer error reporting options', () => {
    expectTypeOf<CreateQueryOptions>().not.toHaveProperty('throwOnError')
  })
})
