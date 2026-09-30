import { QueryClient } from '@tanstack/query-core'
import { queryKey } from '@tanstack/query-test-utils'
import { LitElement } from 'lit'
import { describe, expectTypeOf, it } from 'vitest'
import { createQueriesController } from '../createQueriesController.js'
import { queryOptions } from '../queryOptions.js'
import type {
  DefinedQueryObserverResult,
  QueryObserverResult,
} from '@tanstack/query-core'

class Host extends LitElement {}

describe('createQueriesController', () => {
  it('should infer the result type of each query in a tuple', () => {
    const expectTupleResult = (
      value: [QueryObserverResult<number>, QueryObserverResult<string>],
    ) => value

    const result = createQueriesController(
      new Host(),
      {
        queries: [
          {
            queryKey: queryKey(),
            queryFn: () => Promise.resolve(1),
          },
          {
            queryKey: queryKey(),
            queryFn: () => Promise.resolve('x'),
          },
        ],
      },
      new QueryClient(),
    )

    const data = expectTupleResult(result())
    expectTypeOf(data[0].data).toEqualTypeOf<number | undefined>()
    expectTypeOf(data[1].data).toEqualTypeOf<string | undefined>()
  })

  it('should infer the result type of combine', () => {
    const result = createQueriesController(
      new Host(),
      {
        queries: [
          {
            queryKey: queryKey(),
            queryFn: () => Promise.resolve(7),
          },
          {
            queryKey: queryKey(),
            queryFn: () => Promise.resolve('ok'),
          },
        ],
        combine: (results) => ({
          first: results[0].data,
          second: results[1].data,
        }),
      },
      new QueryClient(),
    )

    expectTypeOf(result().first).toEqualTypeOf<number | undefined>()
    expectTypeOf(result().second).toEqualTypeOf<string | undefined>()
  })

  it('TData should be defined when passed through queryOptions', () => {
    const expectDefinedInitialDataTuple = (
      value: [DefinedQueryObserverResult<{ id: number; name: string }>],
    ) => value

    const result = createQueriesController(
      new Host(),
      {
        queries: [
          queryOptions({
            queryKey: queryKey(),
            queryFn: () => Promise.resolve({ id: 4, name: 'Marie' }),
            initialData: { id: 0, name: 'Seed' },
          }),
        ],
      },
      new QueryClient(),
    )

    const data = expectDefinedInitialDataTuple(result())
    expectTypeOf(data[0].data).toEqualTypeOf<{
      id: number
      name: string
    }>()
  })

  it('TData should be defined in combine when passed through queryOptions', () => {
    const result = createQueriesController(
      new Host(),
      {
        queries: [
          queryOptions({
            queryKey: queryKey(),
            queryFn: () => Promise.resolve({ id: 5, name: 'Katherine' }),
            initialData: { id: 1, name: 'Init' },
          }),
        ],
        combine: (results) => results[0].data.name,
      },
      new QueryClient(),
    )

    const combined: string = result()
    expectTypeOf(combined).toEqualTypeOf<string>()
  })

  it('should return correct data for dynamic queries with mixed result types', () => {
    const expectMappedQueriesResult = (
      value: [
        ...Array<QueryObserverResult<number>>,
        QueryObserverResult<boolean>,
      ],
    ) => value

    const numberQueries = [1, 2, 3].map((value) =>
      queryOptions({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve(value),
      }),
    )
    const result = createQueriesController(
      new Host(),
      {
        queries: [
          ...numberQueries,
          queryOptions({
            queryKey: queryKey(),
            queryFn: () => Promise.resolve(true),
          }),
        ],
      },
      new QueryClient(),
    )

    const data = expectMappedQueriesResult(result())
    expectTypeOf(data[0].data).toEqualTypeOf<number | boolean | undefined>()
  })
})
