import { describe, expectTypeOf, it } from 'vitest'
import { queryKey } from '@tanstack/query-test-utils'
import { createQuery, queryOptions } from '../../src/index.js'

describe('createQuery', () => {
  it('should return the correct states for a successful query', () => {
    const key = queryKey()
    const query = createQuery<string, Error>(() => ({
      queryKey: key,
      queryFn: () => Promise.resolve('test'),
    }))

    if (query.isPending) {
      expectTypeOf(query.data).toEqualTypeOf<undefined>()
      expectTypeOf(query.error).toEqualTypeOf<null>()
    } else if (query.isLoadingError) {
      expectTypeOf(query.data).toEqualTypeOf<undefined>()
      expectTypeOf(query.error).toEqualTypeOf<Error>()
    } else {
      expectTypeOf(query.data).toEqualTypeOf<string>()
      expectTypeOf(query.error).toEqualTypeOf<Error | null>()
    }
  })

  describe('initialData', () => {
    describe('Config object overload', () => {
      it('TData should always be defined when initialData is provided as an object', () => {
        const key = queryKey()
        const { data } = createQuery(() => ({
          queryKey: key,
          queryFn: () => ({ wow: true }),
          initialData: { wow: true },
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
      })

      it('TData should be defined when passed through queryOptions', () => {
        const key = queryKey()
        const options = queryOptions({
          queryKey: key,
          queryFn: () => ({ wow: true }),
          initialData: { wow: true },
        })
        const { data } = createQuery(() => options)

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
      })

      it('TData should have undefined in the union when initialData is NOT provided', () => {
        const key = queryKey()
        const { data } = createQuery(() => ({
          queryKey: key,
          queryFn: () => ({ wow: true }),
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
      })

      it('TData should have undefined in the union when initialData is provided as a function which can return undefined', () => {
        const key = queryKey()
        const { data } = createQuery(() => ({
          queryKey: key,
          queryFn: () => ({ wow: true }),
          initialData: () => undefined as { wow: boolean } | undefined,
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
      })
    })

    describe('Query key overload', () => {
      it('TData should always be defined when initialData is provided', () => {
        const key = queryKey()
        const { data } = createQuery(() => ({
          queryKey: key,
          queryFn: () => ({ wow: true }),
          initialData: { wow: true },
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
      })

      it('TData should have undefined in the union when initialData is NOT provided', () => {
        const key = queryKey()
        const { data } = createQuery(() => ({
          queryKey: key,
          queryFn: () => ({ wow: true }),
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
      })
    })

    describe('Query key and func', () => {
      it('TData should always be defined when initialData is provided', () => {
        const key = queryKey()
        const { data } = createQuery(() => ({
          queryKey: key,
          queryFn: () => ({ wow: true }),
          initialData: { wow: true },
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
      })

      it('TData should have undefined in the union when initialData is NOT provided', () => {
        const key = queryKey()
        const { data } = createQuery(() => ({
          queryKey: key,
          queryFn: () => ({ wow: true }),
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
      })
    })
  })

  describe('generic queryFn', () => {
    it('should infer the result type from a generic query function', () => {
      const key = queryKey()

      function queryFn<T = string>(): Promise<T> {
        return Promise.resolve({} as T)
      }

      const query = createQuery(() => ({
        queryKey: key,
        queryFn: () => queryFn(),
      }))

      expectTypeOf(query.data).toEqualTypeOf<string | undefined>()
      expectTypeOf(query.error).toEqualTypeOf<Error | null>()
    })
  })
})
