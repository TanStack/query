import { describe, expectTypeOf, it } from 'vitest'
import { streamedQuery } from '../streamedQuery'
import type { QueryClient, QueryFunction, QueryKey, QueryMeta } from '..'

function numberStream(): AsyncIterable<number> {
  return {} as AsyncIterable<number>
}

// `StreamedQueryParams` is a union, and `keyof` on a union is the intersection
// of its members' keys, so each arm has to be pinned on its own.
type Params = Parameters<typeof streamedQuery<number, string, ['stream']>>[0]
type SimpleParams = Extract<Params, { reducer?: never }>
type ReducibleParams = Exclude<Params, { reducer?: never }>

describe('streamedQuery', () => {
  describe('TQueryFnData', () => {
    it('should infer the chunk type from the stream returned by streamFn', () => {
      expectTypeOf(
        streamedQuery({
          streamFn: () => numberStream(),
        }),
      ).toEqualTypeOf<QueryFunction<Array<number>, QueryKey>>()
    })

    it('should infer the chunk type from a promise of a stream', () => {
      expectTypeOf(
        streamedQuery({
          streamFn: () => Promise.resolve(numberStream()),
        }),
      ).toEqualTypeOf<QueryFunction<Array<number>, QueryKey>>()
    })

    it('should default to unknown when the stream type cannot be inferred', () => {
      expectTypeOf(
        streamedQuery({
          streamFn: () =>
            ({}) as AsyncIterable<unknown> | Promise<AsyncIterable<unknown>>,
        }),
      ).toEqualTypeOf<QueryFunction<Array<unknown>, QueryKey>>()
    })

    it('should default to unknown when there is no inference site', () => {
      // an `AsyncIterable` of an unconstrained type parameter gives the
      // inference nothing to latch onto, so the default has to fill in
      function streamOf<T>(): AsyncIterable<T> {
        return {} as AsyncIterable<T>
      }

      expectTypeOf(streamedQuery({ streamFn: () => streamOf() })).toEqualTypeOf<
        QueryFunction<Array<unknown>, QueryKey>
      >()
    })
  })

  describe('TData', () => {
    it('should default to an array of the chunk type', () => {
      expectTypeOf(
        streamedQuery<{ value: string }>({
          streamFn: () => ({}) as AsyncIterable<{ value: string }>,
        }),
      ).toEqualTypeOf<QueryFunction<Array<{ value: string }>, QueryKey>>()
    })

    it('should be the reducer result when a reducer is provided', () => {
      expectTypeOf(
        streamedQuery({
          streamFn: () => numberStream(),
          reducer: (acc: string, chunk: number) => acc + chunk,
          initialValue: '',
        }),
      ).toEqualTypeOf<QueryFunction<string, QueryKey>>()
    })
  })

  describe('TQueryKey', () => {
    it('should default to QueryKey', () => {
      streamedQuery({
        streamFn: (context) => {
          expectTypeOf(context.queryKey).toEqualTypeOf<QueryKey>()
          return numberStream()
        },
      })
    })

    it('should be carried into the returned QueryFunction when given explicitly', () => {
      expectTypeOf(
        streamedQuery<number, Array<number>, ['stream', number]>({
          streamFn: () => numberStream(),
        }),
      ).toEqualTypeOf<QueryFunction<Array<number>, ['stream', number]>>()
    })

    it('should only accept a query key', () => {
      // @ts-expect-error a query key must be an array
      streamedQuery<number, Array<number>, string>({
        streamFn: () => numberStream(),
      })

      expectTypeOf(
        streamedQuery<number, Array<number>, ReadonlyArray<unknown>>({
          streamFn: () => numberStream(),
        }),
      ).toEqualTypeOf<QueryFunction<Array<number>, ReadonlyArray<unknown>>>()
    })
  })

  describe('StreamedQueryParams', () => {
    it('should be the only parameter', () => {
      streamedQuery<number, Array<number>, ['stream']>(
        { streamFn: () => numberStream() },
        // @ts-expect-error there is no second parameter
        'extra',
      )

      expectTypeOf<
        Parameters<
          typeof streamedQuery<number, Array<number>, ['stream']>
        >['length']
      >().toEqualTypeOf<1>()
    })

    it('should only expose the options of its simple form', () => {
      expectTypeOf<keyof SimpleParams>().toEqualTypeOf<
        'streamFn' | 'refetchMode' | 'reducer' | 'initialValue'
      >()
    })

    it('should only expose the options of its reducible form', () => {
      expectTypeOf<keyof ReducibleParams>().toEqualTypeOf<
        'streamFn' | 'refetchMode' | 'reducer' | 'initialValue'
      >()
    })

    it('should keep every option writable', () => {
      // `Pick` preserves the `readonly` modifier that an indexed access such as
      // `Params['refetchMode']` silently strips, and distributes over the union
      expectTypeOf<Pick<Params, 'streamFn'>>().toEqualTypeOf<{
        streamFn: (
          context: Parameters<QueryFunction<string, ['stream']>>[0],
        ) => AsyncIterable<number> | Promise<AsyncIterable<number>>
      }>()
      expectTypeOf<Pick<Params, 'refetchMode'>>().toEqualTypeOf<{
        refetchMode?: 'append' | 'reset' | 'replace'
      }>()
      expectTypeOf<
        Pick<ReducibleParams, 'reducer' | 'initialValue'>
      >().toEqualTypeOf<{
        reducer: (acc: string, chunk: number) => string
        initialValue: string
      }>()
    })

    it('should accept an object literal with all of its options', () => {
      expectTypeOf(
        streamedQuery<number, string, ['stream']>({
          streamFn: () => numberStream(),
          refetchMode: 'append',
          reducer: (acc, chunk) => acc + chunk,
          initialValue: '',
        }),
      ).toEqualTypeOf<QueryFunction<string, ['stream']>>()
    })
  })

  describe('streamFn', () => {
    it('should be required', () => {
      // @ts-expect-error streamFn is required
      streamedQuery({})

      expectTypeOf(
        streamedQuery({ streamFn: () => numberStream() }),
      ).toEqualTypeOf<QueryFunction<Array<number>, QueryKey>>()
    })

    it('should type the context it receives', () => {
      streamedQuery<number, Array<number>, ['stream', number]>({
        streamFn: (context) => {
          expectTypeOf(context.queryKey).toEqualTypeOf<['stream', number]>()
          expectTypeOf(context.client).toEqualTypeOf<QueryClient>()
          expectTypeOf(context.signal).toEqualTypeOf<AbortSignal>()
          expectTypeOf(context.meta).toEqualTypeOf<QueryMeta | undefined>()
          expectTypeOf(context.pageParam).toEqualTypeOf<unknown>()
          expectTypeOf(context.direction).toEqualTypeOf<unknown>()
          return numberStream()
        },
      })
    })

    it('should reject a stream whose chunk type does not match', () => {
      streamedQuery<number>({
        // @ts-expect-error the stream must yield numbers
        streamFn: () => ({}) as AsyncIterable<string>,
      })

      expectTypeOf(
        streamedQuery<number>({
          streamFn: () => ({}) as AsyncIterable<number>,
        }),
      ).toEqualTypeOf<QueryFunction<Array<number>, QueryKey>>()
    })

    it('should reject a stream that is not an AsyncIterable', () => {
      streamedQuery({
        // @ts-expect-error a plain array is not an AsyncIterable
        streamFn: () => [1, 2, 3],
      })

      expectTypeOf(
        streamedQuery({ streamFn: () => numberStream() }),
      ).toEqualTypeOf<QueryFunction<Array<number>, QueryKey>>()
    })
  })

  describe('refetchMode', () => {
    it('should be optional', () => {
      expectTypeOf(
        streamedQuery({ streamFn: () => numberStream() }),
      ).toEqualTypeOf<QueryFunction<Array<number>, QueryKey>>()
    })

    it('should only accept append, reset or replace', () => {
      streamedQuery({
        streamFn: () => numberStream(),
        // @ts-expect-error 'merge' is not a valid refetch mode
        refetchMode: 'merge',
      })

      expectTypeOf(
        streamedQuery({
          streamFn: () => numberStream(),
          refetchMode: 'append',
        }),
      ).toEqualTypeOf<QueryFunction<Array<number>, QueryKey>>()
      expectTypeOf(
        streamedQuery({
          streamFn: () => numberStream(),
          refetchMode: 'reset',
        }),
      ).toEqualTypeOf<QueryFunction<Array<number>, QueryKey>>()
      expectTypeOf(
        streamedQuery({
          streamFn: () => numberStream(),
          refetchMode: 'replace',
        }),
      ).toEqualTypeOf<QueryFunction<Array<number>, QueryKey>>()
    })
  })

  describe('reducer', () => {
    it('should not be accepted without initialValue', () => {
      streamedQuery({
        streamFn: () => numberStream(),
        // @ts-expect-error a reducer requires an initialValue
        reducer: (acc: string, chunk: number) => acc + chunk,
      })

      expectTypeOf(
        streamedQuery({
          streamFn: () => numberStream(),
          reducer: (acc: string, chunk: number) => acc + chunk,
          initialValue: '',
        }),
      ).toEqualTypeOf<QueryFunction<string, QueryKey>>()
    })

    it('should type its accumulator and chunk parameters', () => {
      streamedQuery<number, string>({
        streamFn: () => numberStream(),
        reducer: (acc, chunk) => {
          expectTypeOf(acc).toEqualTypeOf<string>()
          expectTypeOf(chunk).toEqualTypeOf<number>()
          return acc + chunk
        },
        initialValue: '',
      })
    })

    it('should reject a return type that does not match the accumulator', () => {
      streamedQuery<number, string>({
        streamFn: () => numberStream(),
        // @ts-expect-error the reducer must return the accumulator type
        reducer: (_acc, chunk) => chunk,
        initialValue: '',
      })

      expectTypeOf(
        streamedQuery<number, string>({
          streamFn: () => numberStream(),
          reducer: (_acc, chunk) => String(chunk),
          initialValue: '',
        }),
      ).toEqualTypeOf<QueryFunction<string, QueryKey>>()
    })
  })

  describe('initialValue', () => {
    it('should not be accepted without a reducer', () => {
      streamedQuery({
        streamFn: () => numberStream(),
        // @ts-expect-error an initialValue requires a reducer
        initialValue: '',
      })

      expectTypeOf(
        streamedQuery({
          streamFn: () => numberStream(),
          reducer: (acc: string, chunk: number) => acc + chunk,
          initialValue: '',
        }),
      ).toEqualTypeOf<QueryFunction<string, QueryKey>>()
    })

    it('should be required alongside a reducer', () => {
      streamedQuery<number, string>({
        streamFn: () => numberStream(),
        reducer: (acc, chunk) => acc + chunk,
        // @ts-expect-error initialValue must match TData
        initialValue: 0,
      })

      expectTypeOf(
        streamedQuery<number, string>({
          streamFn: () => numberStream(),
          reducer: (acc, chunk) => acc + chunk,
          initialValue: '',
        }),
      ).toEqualTypeOf<QueryFunction<string, QueryKey>>()
    })
  })

  describe('QueryFunction', () => {
    it('should return the accumulated data, not a single chunk', () => {
      const queryFn = streamedQuery({
        streamFn: () => numberStream(),
      })

      expectTypeOf(queryFn).returns.toEqualTypeOf<
        Array<number> | Promise<Array<number>>
      >()
    })

    it('should take the query function context as its only parameter', () => {
      const queryFn = streamedQuery<number, Array<number>, ['stream']>({
        streamFn: () => numberStream(),
      })

      expectTypeOf(queryFn).parameter(0).toHaveProperty('queryKey')
      expectTypeOf(queryFn)
        .parameter(0)
        .toEqualTypeOf<
          Parameters<QueryFunction<Array<number>, ['stream']>>[0]
        >()
    })
  })
})
