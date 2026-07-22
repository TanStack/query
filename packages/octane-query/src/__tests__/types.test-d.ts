import { expectTypeOf, it } from 'vitest'
import {
  QueryErrorResetBoundary,
  useQueries,
  useSuspenseQueries,
} from '../index'
import type { QueryErrorResetBoundaryValue } from '../index'

it('infers each useQueries tuple entry', () => {
  const result = useQueries({
    queries: [
      {
        queryKey: ['count'],
        queryFn: async () => 1,
      },
      {
        queryKey: ['label'],
        queryFn: async () => 'ready',
      },
    ],
  })

  expectTypeOf(result[0].data).toEqualTypeOf<number | undefined>()
  expectTypeOf(result[1].data).toEqualTypeOf<string | undefined>()
})

it('infers each useSuspenseQueries tuple entry as defined', () => {
  const result = useSuspenseQueries({
    queries: [
      {
        queryKey: ['count'],
        queryFn: async () => 1,
      },
      {
        queryKey: ['label'],
        queryFn: async () => 'ready',
      },
    ],
  })

  expectTypeOf(result[0].data).toEqualTypeOf<number>()
  expectTypeOf(result[1].data).toEqualTypeOf<string>()
})

it('contextually types the query error reset render prop', () => {
  QueryErrorResetBoundary({
    children: ({ clearReset, isReset, reset }) => {
      expectTypeOf(clearReset).toEqualTypeOf<() => void>()
      expectTypeOf(isReset).toEqualTypeOf<() => boolean>()
      expectTypeOf(reset).toEqualTypeOf<() => void>()
      return undefined
    },
  })
})

it('exports the query error reset boundary value type', () => {
  expectTypeOf<QueryErrorResetBoundaryValue>().toEqualTypeOf<{
    clearReset: () => void
    isReset: () => boolean
    reset: () => void
  }>()
})
