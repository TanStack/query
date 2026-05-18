import { describe, expectTypeOf, it } from 'vitest'
import { queryKey } from '@tanstack/query-test-utils'
import { createQuery, queryOptions } from '../../src/index.js'
import type { CreateQueryResult } from '../../src/index.js'

describe('createQuery', () => {
  describe('select', () => {
    it('should infer select data type from queryFn return (issue #7673)', () => {
      const key = queryKey()
      const { data } = createQuery(() => ({
        queryKey: key,
        queryFn: () => Promise.resolve({ a: { b: { c: 'hello' } } }),
        select: (input) => input.a.b.c,
      }))

      expectTypeOf(data).toEqualTypeOf<string | undefined>()
    })

    it('should infer select data type when options come from queryOptions', () => {
      const key = queryKey()
      const options = queryOptions({
        queryKey: key,
        queryFn: () => Promise.resolve(1),
      })
      const { data } = createQuery(() => ({
        ...options,
        select: (input) => input > 1,
      }))

      expectTypeOf(data).toEqualTypeOf<boolean | undefined>()
    })

    // eslint-disable-next-line vitest/expect-expect
    it('TData should depend on arguments only, not on the result type annotation', () => {
      // @ts-expect-error TData inferred from queryFn ({ wow: boolean }), not from result
      const result: CreateQueryResult<{ wow: string }> = createQuery(() => ({
        queryKey: queryKey(),
        queryFn: () => ({ wow: true }),
      }))

      void result
    })
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
