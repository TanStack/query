import { createQuery, queryOptions } from '@tanstack/svelte-query'
import { describe, expectTypeOf, it } from 'vitest'

describe('initialData', () => {
  describe('Config object overload', () => {
    it('TData should always be defined when initialData is provided as an object', () => {
      const { data } = createQuery(() => ({
        queryKey: ['key'],
        queryFn: () => ({ wow: true }),
        initialData: { wow: true },
      }))

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
    })

    it('TData should be defined when passed through queryOptions', () => {
      const options = queryOptions({
        queryKey: ['key'],
        queryFn: () => ({ wow: true }),
        initialData: { wow: true },
      })
      const { data } = createQuery(() => options)

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
    })

    it('TData should have undefined in the union when initialData is NOT provided', () => {
      const { data } = createQuery(() => ({
        queryKey: ['key'],
        queryFn: () => ({ wow: true }),
      }))

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
    })

    it('TData should have undefined in the union when initialData is provided as a function which can return undefined', () => {
      const { data } = createQuery(() => ({
        queryKey: ['key'],
        queryFn: () => ({ wow: true }),
        initialData: () => undefined as { wow: boolean } | undefined,
      }))

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
    })
  })

  describe('Query key overload', () => {
    it('TData should always be defined when initialData is provided', () => {
      const { data } = createQuery(() => ({
        queryKey: ['key'],
        queryFn: () => ({ wow: true }),
        initialData: { wow: true },
      }))

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
    })

    it('TData should have undefined in the union when initialData is NOT provided', () => {
      const { data } = createQuery(() => ({
        queryKey: ['key'],
        queryFn: () => ({ wow: true }),
      }))

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
    })
  })

  describe('Query key and func', () => {
    it('TData should always be defined when initialData is provided', () => {
      const { data } = createQuery(() => ({
        queryKey: ['key'],
        queryFn: () => ({ wow: true }),
        initialData: { wow: true },
      }))

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
    })

    it('TData should have undefined in the union when initialData is NOT provided', () => {
      const { data } = createQuery(() => ({
        queryKey: ['key'],
        queryFn: () => ({ wow: true }),
      }))

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
    })
  })
})
