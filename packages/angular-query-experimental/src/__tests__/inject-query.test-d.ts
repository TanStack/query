import { describe, expectTypeOf, it } from 'vitest'
import { injectQuery, queryOptions } from '..'
import { simpleFetcher } from './test-utils'
import type { Signal } from '@angular/core'

describe('initialData', () => {
  describe('Config object overload', () => {
    it('TData should always be defined when initialData is provided as an object', () => {
      const { data } = injectQuery(() => ({
        queryKey: ['key'],
        queryFn: () => ({ wow: true }),
        initialData: { wow: true },
      }))

      expectTypeOf(data).toEqualTypeOf<Signal<{ wow: boolean }>>()
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
  })

  describe('structuralSharing', () => {
    it('should restrict to same types', () => {
      injectQuery(() => ({
        queryKey: ['key'],
        queryFn: () => 5,
        structuralSharing: (_oldData, newData) => {
          return newData
        },
      }))
    })
  })
})

describe('Discriminated union return type', () => {
  test('data should be possibly undefined by default', () => {
    const query = injectQuery(() => ({
      queryKey: ['key'],
      queryFn: simpleFetcher,
    }))

    expectTypeOf(query.data).toEqualTypeOf<Signal<string | undefined>>()
  })

  test('data should be defined when query is success', () => {
    const query = injectQuery(() => ({
      queryKey: ['key'],
      queryFn: simpleFetcher,
    }))

    if (query.isSuccess()) {
      expectTypeOf(query.data).toEqualTypeOf<Signal<string>>()
    }
  })

  test('error should be null when query is success', () => {
    const query = injectQuery(() => ({
      queryKey: ['key'],
      queryFn: simpleFetcher,
    }))

    if (query.isSuccess()) {
      expectTypeOf(query.error).toEqualTypeOf<Signal<null>>()
    }
  })

  test('data should be undefined when query is pending', () => {
    const query = injectQuery(() => ({
      queryKey: ['key'],
      queryFn: simpleFetcher,
    }))

    if (query.isPending()) {
      expectTypeOf(query.data).toEqualTypeOf<Signal<undefined>>()
    }
  })

  test('error should be defined when query is error', () => {
    const query = injectQuery(() => ({
      queryKey: ['key'],
      queryFn: simpleFetcher,
    }))

    if (query.isError()) {
      expectTypeOf(query.error).toEqualTypeOf<Signal<Error>>()
    }
  })
})
