import { describe, expectTypeOf, it } from 'vitest'
import { queryKey } from '@tanstack/query-test-utils'
import { queryOptions, useQuery } from '../index'

describe('useQuery', () => {
  describe('initialData', () => {
    describe('Config object overload', () => {
      it('TData should always be defined when initialData is provided as an object', () => {
        const { data } = useQuery(() => ({
          queryKey: queryKey(),
          queryFn: () => ({ wow: true }),
          initialData: { wow: true },
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
      })

      it('TData should be defined when passed through queryOptions', () => {
        const options = queryOptions({
          queryKey: queryKey(),
          queryFn: () => ({ wow: true }),
          initialData: { wow: true },
        })
        const { data } = useQuery(() => options)

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
      })

      it('TData should always be defined when initialData is provided as a function which ALWAYS returns the data', () => {
        const { data } = useQuery(() => ({
          queryKey: queryKey(),
          queryFn: () => ({ wow: true }),
          initialData: () => ({ wow: true }),
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
      })

      it('TData should have undefined in the union when initialData is NOT provided', () => {
        const { data } = useQuery(() => ({
          queryKey: queryKey(),
          queryFn: () => ({ wow: true }),
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
      })

      it('TData should have undefined in the union when initialData is provided as a function which can return undefined', () => {
        const { data } = useQuery(() => ({
          queryKey: queryKey(),
          queryFn: () => ({ wow: true }),
          initialData: () => undefined as { wow: boolean } | undefined,
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
      })
    })

    describe('Query key overload', () => {
      it('TData should always be defined when initialData is provided', () => {
        const { data } = useQuery(() => ({
          queryKey: queryKey(),
          queryFn: () => ({ wow: true }),
          initialData: { wow: true },
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
      })

      it('TData should have undefined in the union when initialData is NOT provided', () => {
        const { data } = useQuery(() => ({
          queryKey: queryKey(),
          queryFn: () => ({ wow: true }),
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
      })
    })

    describe('Query key and func', () => {
      it('TData should always be defined when initialData is provided', () => {
        const { data } = useQuery(() => ({
          queryKey: queryKey(),
          queryFn: () => ({ wow: true }),
          initialData: { wow: true },
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
      })

      it('TData should have undefined in the union when initialData is NOT provided', () => {
        const { data } = useQuery(() => ({
          queryKey: queryKey(),
          queryFn: () => ({ wow: true }),
        }))

        expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
      })
    })
  })
})
