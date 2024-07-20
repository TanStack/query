import { describe, expectTypeOf, test } from 'vitest'
import { createQuery, queryOptions } from '../../src/index'
import type { OmitKeyof } from '@tanstack/query-core'
import type { CreateQueryOptions } from '../../src/index'

describe('createQuery', () => {
  test('TData should always be defined when initialData is provided as an object', () => {
    const query = createQuery({
      queryKey: ['key'],
      queryFn: () => ({ wow: true }),
      initialData: { wow: true },
    })

    expectTypeOf(query.data).toEqualTypeOf<{ wow: boolean }>()
  })

  test('TData should be defined when passed through queryOptions', () => {
    const options = queryOptions({
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
    const query = createQuery(options)

    expectTypeOf(query.data).toEqualTypeOf<{ wow: boolean }>()
  })

  test('TData should have undefined in the union when initialData is NOT provided', () => {
    const query = createQuery({
      queryKey: ['key'],
      queryFn: () => {
        return {
          wow: true,
        }
      },
    })

    expectTypeOf(query.data).toEqualTypeOf<{ wow: boolean } | undefined>()
  })

  test('Allow custom hooks using CreateQueryOptions', () => {
    type Data = string

    const useCustomQuery = (
      options?: OmitKeyof<CreateQueryOptions<Data>, 'queryKey' | 'queryFn'>,
    ) => {
      return createQuery({
        ...options,
        queryKey: ['todos-key'],
        queryFn: () => Promise.resolve('data'),
      })
    }

    const query = useCustomQuery()

    expectTypeOf(query.data).toEqualTypeOf<Data | undefined>()
  })
})
