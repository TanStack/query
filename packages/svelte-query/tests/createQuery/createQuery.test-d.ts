import { describe, expectTypeOf, it } from 'vitest'
import { queryKey } from '@tanstack/query-test-utils'
import { createQuery, queryOptions } from '../../src/index.js'
import type {
  Query,
  QueryFunctionContext,
  QueryKey,
} from '@tanstack/query-core'

describe('createQuery', () => {
  it('should allow a per-query persister', () => {
    const persister = undefined as unknown as <T, TQueryKey extends QueryKey>(
      queryFn: (context: QueryFunctionContext<TQueryKey>) => T | Promise<T>,
      context: QueryFunctionContext<TQueryKey>,
      query: Query,
    ) => Promise<T>

    const { data } = createQuery(() => ({
      queryKey: ['todos'],
      queryFn: () => Promise.resolve(['todo']),
      persister,
    }))

    expectTypeOf(data).toEqualTypeOf<Array<string> | undefined>()
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
})
