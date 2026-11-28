import { createKey } from '@tanstack/query-test-utils'
import { afterEach, beforeEach, describe, expectTypeOf, it } from 'vitest'
import {
  InfiniteQueryObserver,
  QueryClient,
  clearQueryClient,
  isLoading,
  isLoadingError,
  isPending,
  isRefetchError,
  isSuccess,
  mountQueryClient,
  select,
} from '..'
import type {
  DefaultError,
  DefinedInfiniteQueryObserverResult,
  FetchNextPageOptions,
  FetchPreviousPageOptions,
  GetNextPageParamFunction,
  GetPreviousPageParamFunction,
  InfiniteData,
  InfiniteQueryObserverBaseResult,
  InfiniteQueryObserverLoadingErrorResult,
  InfiniteQueryObserverLoadingResult,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverPendingResult,
  InfiniteQueryObserverPlaceholderResult,
  InfiniteQueryObserverRefetchErrorResult,
  InfiniteQueryObserverResult,
  InfiniteQueryObserverSuccessResult,
  QueryFunctionContext,
  QueryObserverBaseResult,
  QueryObserverResult,
  QueryPersister,
  isError,
  isFetchNextPageError,
  isFetchPreviousPageError,
  isFetchingNextPage,
  isFetchingPreviousPage,
} from '..'
import type { FlagFor, Guarded, GuardedProperties } from './helpers/result'

class CustomError extends Error {
  override name = 'CustomError' as const
}

describe('infiniteQueryObserver', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    mountQueryClient(queryClient)
  })

  afterEach(() => {
    clearQueryClient(queryClient)
  })

  describe('InfiniteQueryObserverOptions', () => {
    it('should keep every option writable', () => {
      type Options = InfiniteQueryObserverOptions<
        { value: string },
        CustomError,
        InfiniteData<{ value: string }, number>,
        ReadonlyArray<unknown>,
        number
      >

      expectTypeOf<Options>().toEqualTypeOf<{
        -readonly [K in keyof Options]: Options[K]
      }>()
    })

    it('should default its page param to unknown', () => {
      expectTypeOf<
        InfiniteQueryObserverOptions<{ value: string }>['initialPageParam']
      >().toEqualTypeOf<unknown>()
    })

    describe('initialPageParam', () => {
      it('should be required', () => {
        // @ts-expect-error initialPageParam is required
        new InfiniteQueryObserver(queryClient, {
          queryKey: createKey(),
          queryFn: () => Promise.resolve('data'),
          getNextPageParam: () => 1,
        })

        expectTypeOf(
          new InfiniteQueryObserver(queryClient, {
            queryKey: createKey(),
            queryFn: () => Promise.resolve('data'),
            initialPageParam: 1,
            getNextPageParam: () => 1,
          }),
        ).toBeObject()
      })

      it('should widen a literal to its base type', () => {
        const observer = new InfiniteQueryObserver(queryClient, {
          queryKey: createKey(),
          queryFn: () => Promise.resolve('data'),
          initialPageParam: 1,
          getNextPageParam: () => 1,
        })

        expectTypeOf(observer.setOptions)
          .parameter(0)
          .toHaveProperty('initialPageParam')
          .toEqualTypeOf<number>()
      })
    })

    describe('getNextPageParam', () => {
      it('should be required', () => {
        // @ts-expect-error getNextPageParam is required
        new InfiniteQueryObserver(queryClient, {
          queryKey: createKey(),
          queryFn: () => Promise.resolve('data'),
          initialPageParam: 1,
        })

        expectTypeOf(
          new InfiniteQueryObserver(queryClient, {
            queryKey: createKey(),
            queryFn: () => Promise.resolve('data'),
            initialPageParam: 1,
            getNextPageParam: () => 1,
          }),
        ).toBeObject()
      })

      it('should type the pages and page params it is given', () => {
        new InfiniteQueryObserver(queryClient, {
          queryKey: createKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
          initialPageParam: 1,
          getNextPageParam: (
            lastPage,
            allPages,
            lastPageParam,
            allPageParams,
          ) => {
            expectTypeOf(lastPage).toEqualTypeOf<{ value: string }>()
            expectTypeOf(allPages).toEqualTypeOf<Array<{ value: string }>>()
            expectTypeOf(lastPageParam).toEqualTypeOf<number>()
            expectTypeOf(allPageParams).toEqualTypeOf<Array<number>>()
            return 1
          },
        })
      })

      it('should only accept the page param, undefined or null', () => {
        expectTypeOf<
          GetNextPageParamFunction<number, { value: string }>
        >().returns.toEqualTypeOf<number | undefined | null>()
      })
    })

    describe('getPreviousPageParam', () => {
      it('should be optional', () => {
        expectTypeOf<
          InfiniteQueryObserverOptions<
            { value: string },
            DefaultError,
            InfiniteData<{ value: string }, number>,
            ReadonlyArray<unknown>,
            number
          >['getPreviousPageParam']
        >().toEqualTypeOf<
          GetPreviousPageParamFunction<number, { value: string }> | undefined
        >()
      })

      it('should type the pages and page params it is given', () => {
        new InfiniteQueryObserver(queryClient, {
          queryKey: createKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
          initialPageParam: 1,
          getNextPageParam: () => 1,
          getPreviousPageParam: (
            firstPage,
            allPages,
            firstPageParam,
            allPageParams,
          ) => {
            expectTypeOf(firstPage).toEqualTypeOf<{ value: string }>()
            expectTypeOf(allPages).toEqualTypeOf<Array<{ value: string }>>()
            expectTypeOf(firstPageParam).toEqualTypeOf<number>()
            expectTypeOf(allPageParams).toEqualTypeOf<Array<number>>()
            return 1
          },
        })
      })

      it('should only accept the page param, undefined or null', () => {
        expectTypeOf<
          GetPreviousPageParamFunction<number, { value: string }>
        >().returns.toEqualTypeOf<number | undefined | null>()
      })
    })

    describe('maxPages', () => {
      it('should only accept a number', () => {
        expectTypeOf<InfiniteQueryObserverOptions['maxPages']>().toEqualTypeOf<
          number | undefined
        >()
      })
    })

    describe('_type', () => {
      it('should only accept the infinite literal', () => {
        expectTypeOf<InfiniteQueryObserverOptions['_type']>().toEqualTypeOf<
          'infinite' | undefined
        >()
      })
    })

    describe('queryFn', () => {
      it('should type the page param of the context it is given', () => {
        new InfiniteQueryObserver(queryClient, {
          queryKey: createKey(),
          initialPageParam: 1,
          getNextPageParam: () => 1,
          queryFn: (context) => {
            expectTypeOf(context.pageParam).toEqualTypeOf<number>()
            return Promise.resolve('data')
          },
        })
      })

      it('should type the remaining fields of the context it is given', () => {
        const key = ['a', 1] as const

        new InfiniteQueryObserver(queryClient, {
          queryKey: key,
          initialPageParam: 1,
          getNextPageParam: () => 1,
          queryFn: (context) => {
            expectTypeOf(context.queryKey).toEqualTypeOf<readonly ['a', 1]>()
            expectTypeOf(context.signal).toEqualTypeOf<AbortSignal>()
            expectTypeOf(context.client).toEqualTypeOf<QueryClient>()
            expectTypeOf(context.meta).toEqualTypeOf<
              Record<string, unknown> | undefined
            >()
            return Promise.resolve('data')
          },
        })
      })

      it('should require the page param on the paged context type', () => {
        type Context = QueryFunctionContext<ReadonlyArray<unknown>, number>
        type OptionalKeys = {
          [K in keyof Context]-?: {} extends Pick<Context, K> ? K : never
        }[keyof Context]

        expectTypeOf<
          'pageParam' extends OptionalKeys ? true : false
        >().toEqualTypeOf<false>()
      })

      it('should leave the page param unknown on an unpaged context type', () => {
        expectTypeOf<
          QueryFunctionContext<ReadonlyArray<unknown>>['pageParam']
        >().toEqualTypeOf<unknown>()
      })
    })

    describe('persister', () => {
      it('should type the page param of the queryFn it is given', () => {
        new InfiniteQueryObserver(queryClient, {
          queryKey: createKey(),
          queryFn: () => Promise.resolve('data'),
          initialPageParam: 1,
          getNextPageParam: () => 1,
          persister: (persistedQueryFn) => {
            expectTypeOf(persistedQueryFn)
              .parameter(0)
              .toHaveProperty('pageParam')
              .toEqualTypeOf<number>()
            return 'data'
          },
        })
      })

      it('should leave the page param of the queryFn unknown when unpaged', () => {
        expectTypeOf<QueryPersister<string, ReadonlyArray<unknown>>>()
          .parameter(0)
          .parameter(0)
          .toHaveProperty('pageParam')
          .toEqualTypeOf<unknown>()
      })

      it('should keep the context it is given unpaged', () => {
        expectTypeOf<QueryPersister<string, ReadonlyArray<unknown>, number>>()
          .parameter(1)
          .toHaveProperty('pageParam')
          .toEqualTypeOf<unknown>()
      })

      it('should return the queryFn data or a promise of it', () => {
        expectTypeOf<
          QueryPersister<{ value: string }, ReadonlyArray<unknown>, number>
        >().returns.toEqualTypeOf<
          { value: string } | Promise<{ value: string }>
        >()
      })
    })

    describe('select', () => {
      it('should be given the paged data', () => {
        new InfiniteQueryObserver(queryClient, {
          queryKey: createKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
          initialPageParam: 1,
          getNextPageParam: () => 1,
          select: [
            select,
            (data) => {
              expectTypeOf(data).toEqualTypeOf<
                InfiniteData<{ value: string }, number>
              >()
              return data.pages
            },
          ],
        })
      })

      it('should type the result data as what select returns', () => {
        const observer = new InfiniteQueryObserver(queryClient, {
          queryKey: createKey(),
          queryFn: () => Promise.resolve({ count: 1 }),
          initialPageParam: 1,
          getNextPageParam: () => 1,
          select: [select, (data) => data.pages.length],
        })

        expectTypeOf(observer.getCurrentResult().data).toEqualTypeOf<
          number | undefined
        >()
      })
    })
  })

  describe('InfiniteData', () => {
    it('should keep every property writable', () => {
      type Data = InfiniteData<{ value: string }, number>

      expectTypeOf<Data>().toEqualTypeOf<{
        -readonly [K in keyof Data]: Data[K]
      }>()
    })

    it('should type its pages from the page data', () => {
      expectTypeOf<
        InfiniteData<{ value: string }, number>['pages']
      >().toEqualTypeOf<Array<{ value: string }>>()
    })

    it('should type its page params from the page param', () => {
      expectTypeOf<
        InfiniteData<{ value: string }, number>['pageParams']
      >().toEqualTypeOf<Array<number>>()
    })

    it('should default its page param to unknown', () => {
      expectTypeOf<
        InfiniteData<{ value: string }>['pageParams']
      >().toEqualTypeOf<Array<unknown>>()
    })

    it('should declare exactly its pages and page params', () => {
      expectTypeOf<
        keyof InfiniteData<{ value: string }, number>
      >().toEqualTypeOf<'pages' | 'pageParams'>()
    })

    it('should always declare its pages and page params', () => {
      type Data = InfiniteData<{ value: string }, number>
      type OptionalKeys = {
        [K in keyof Data]-?: {} extends Pick<Data, K> ? K : never
      }[keyof Data]

      expectTypeOf<
        'pages' extends OptionalKeys ? true : false
      >().toEqualTypeOf<false>()
      expectTypeOf<
        'pageParams' extends OptionalKeys ? true : false
      >().toEqualTypeOf<false>()
    })
  })

  describe('InfiniteQueryObserverResult', () => {
    describe('InfiniteQueryObserverBaseResult', () => {
      it('should keep every property writable', () => {
        type Base = InfiniteQueryObserverBaseResult<
          InfiniteData<{ value: string }, number>,
          CustomError
        >

        expectTypeOf<Base>().toEqualTypeOf<{
          -readonly [K in keyof Base]: Base[K]
        }>()
      })

      it('should declare exactly the paged keys it adds to the base result', () => {
        expectTypeOf<keyof InfiniteQueryObserverBaseResult>().toEqualTypeOf<
          | keyof QueryObserverBaseResult
          | 'fetchNextPage'
          | 'fetchPreviousPage'
          | 'hasNextPage'
          | 'hasPreviousPage'
          | 'fetchDirection'
        >()
      })

      it('should keep every property of each result branch writable', () => {
        type Writable<T> = { -readonly [K in keyof T]: T[K] }
        type Branch<TFilter> = Extract<
          InfiniteQueryObserverResult<
            InfiniteData<{ value: string }, number>,
            CustomError
          >,
          TFilter
        >

        expectTypeOf<Branch<{ status: 'pending' }>>().toEqualTypeOf<
          Writable<Branch<{ status: 'pending' }>>
        >()
        expectTypeOf<
          GuardedProperties<
            typeof isLoading<
              InfiniteQueryObserverResult<
                InfiniteData<{ value: string }, number>,
                CustomError
              >
            >
          >
        >().toEqualTypeOf<
          Writable<
            GuardedProperties<
              typeof isLoading<
                InfiniteQueryObserverResult<
                  InfiniteData<{ value: string }, number>,
                  CustomError
                >
              >
            >
          >
        >()
        expectTypeOf<
          GuardedProperties<
            typeof isLoadingError<
              InfiniteQueryObserverResult<
                InfiniteData<{ value: string }, number>,
                CustomError
              >
            >
          >
        >().toEqualTypeOf<
          Writable<
            GuardedProperties<
              typeof isLoadingError<
                InfiniteQueryObserverResult<
                  InfiniteData<{ value: string }, number>,
                  CustomError
                >
              >
            >
          >
        >()
        expectTypeOf<
          GuardedProperties<
            typeof isRefetchError<
              InfiniteQueryObserverResult<
                InfiniteData<{ value: string }, number>,
                CustomError
              >
            >
          >
        >().toEqualTypeOf<
          Writable<
            GuardedProperties<
              typeof isRefetchError<
                InfiniteQueryObserverResult<
                  InfiniteData<{ value: string }, number>,
                  CustomError
                >
              >
            >
          >
        >()
        expectTypeOf<
          GuardedProperties<
            typeof isSuccess<
              InfiniteQueryObserverResult<
                InfiniteData<{ value: string }, number>,
                CustomError
              >
            >
          >
        >().toEqualTypeOf<
          Writable<
            GuardedProperties<
              typeof isSuccess<
                InfiniteQueryObserverResult<
                  InfiniteData<{ value: string }, number>,
                  CustomError
                >
              >
            >
          >
        >()
        expectTypeOf<Branch<{ isPlaceholderData: true }>>().toEqualTypeOf<
          Writable<Branch<{ isPlaceholderData: true }>>
        >()
      })

      it('should always declare the infinite properties it adds', () => {
        type Base = InfiniteQueryObserverBaseResult<
          InfiniteData<{ value: string }, number>,
          CustomError
        >
        type OptionalKeys = {
          [K in keyof Base]-?: {} extends Pick<Base, K> ? K : never
        }[keyof Base]

        expectTypeOf<
          'fetchNextPage' extends OptionalKeys ? true : false
        >().toEqualTypeOf<false>()
        expectTypeOf<
          'fetchPreviousPage' extends OptionalKeys ? true : false
        >().toEqualTypeOf<false>()
        expectTypeOf<
          'hasNextPage' extends OptionalKeys ? true : false
        >().toEqualTypeOf<false>()
        expectTypeOf<
          'hasPreviousPage' extends OptionalKeys ? true : false
        >().toEqualTypeOf<false>()
      })

      describe('hasNextPage', () => {
        it('should be typed as a boolean', () => {
          expectTypeOf<
            InfiniteQueryObserverBaseResult<
              InfiniteData<{ value: string }, number>,
              CustomError
            >['hasNextPage']
          >().toEqualTypeOf<boolean>()
        })
      })

      describe('hasPreviousPage', () => {
        it('should be typed as a boolean', () => {
          expectTypeOf<
            InfiniteQueryObserverBaseResult<
              InfiniteData<{ value: string }, number>,
              CustomError
            >['hasPreviousPage']
          >().toEqualTypeOf<boolean>()
        })
      })

      describe('isFetchNextPageError', () => {
        it('should be typed as a boolean', () => {
          expectTypeOf<
            FlagFor<
              InfiniteQueryObserverBaseResult<
                InfiniteData<{ value: string }, number>,
                CustomError
              >,
              typeof isFetchNextPageError<
                InfiniteQueryObserverBaseResult<
                  InfiniteData<{ value: string }, number>,
                  CustomError
                >
              >
            >
          >().toEqualTypeOf<boolean>()
        })
      })

      describe('isFetchPreviousPageError', () => {
        it('should be typed as a boolean', () => {
          expectTypeOf<
            FlagFor<
              InfiniteQueryObserverBaseResult<
                InfiniteData<{ value: string }, number>,
                CustomError
              >,
              typeof isFetchPreviousPageError<
                InfiniteQueryObserverBaseResult<
                  InfiniteData<{ value: string }, number>,
                  CustomError
                >
              >
            >
          >().toEqualTypeOf<boolean>()
        })
      })

      describe('isFetchingNextPage', () => {
        it('should be typed as a boolean', () => {
          expectTypeOf<
            FlagFor<
              InfiniteQueryObserverBaseResult<
                InfiniteData<{ value: string }, number>,
                CustomError
              >,
              typeof isFetchingNextPage<
                InfiniteQueryObserverBaseResult<
                  InfiniteData<{ value: string }, number>,
                  CustomError
                >
              >
            >
          >().toEqualTypeOf<boolean>()
        })
      })

      describe('isFetchingPreviousPage', () => {
        it('should be typed as a boolean', () => {
          expectTypeOf<
            FlagFor<
              InfiniteQueryObserverBaseResult<
                InfiniteData<{ value: string }, number>,
                CustomError
              >,
              typeof isFetchingPreviousPage<
                InfiniteQueryObserverBaseResult<
                  InfiniteData<{ value: string }, number>,
                  CustomError
                >
              >
            >
          >().toEqualTypeOf<boolean>()
        })
      })

      describe('fetchNextPage', () => {
        it('should resolve with the infinite result type', () => {
          expectTypeOf<
            InfiniteQueryObserverBaseResult<
              InfiniteData<{ value: string }, number>,
              CustomError
            >['fetchNextPage']
          >().returns.toEqualTypeOf<
            Promise<
              InfiniteQueryObserverResult<
                InfiniteData<{ value: string }, number>,
                CustomError
              >
            >
          >()
        })

        it('should only accept FetchNextPageOptions', () => {
          expectTypeOf<
            InfiniteQueryObserverBaseResult<
              InfiniteData<{ value: string }, number>,
              CustomError
            >['fetchNextPage']
          >().parameters.toEqualTypeOf<[options?: FetchNextPageOptions]>()
        })
      })

      describe('fetchPreviousPage', () => {
        it('should resolve with the infinite result type', () => {
          expectTypeOf<
            InfiniteQueryObserverBaseResult<
              InfiniteData<{ value: string }, number>,
              CustomError
            >['fetchPreviousPage']
          >().returns.toEqualTypeOf<
            Promise<
              InfiniteQueryObserverResult<
                InfiniteData<{ value: string }, number>,
                CustomError
              >
            >
          >()
        })

        it('should only accept FetchPreviousPageOptions', () => {
          expectTypeOf<
            InfiniteQueryObserverBaseResult<
              InfiniteData<{ value: string }, number>,
              CustomError
            >['fetchPreviousPage']
          >().parameters.toEqualTypeOf<[options?: FetchPreviousPageOptions]>()
        })
      })

      describe('data', () => {
        it('should be typed as the paged data or undefined', () => {
          expectTypeOf<
            InfiniteQueryObserverBaseResult<
              InfiniteData<{ value: string }, number>,
              CustomError
            >['data']
          >().toEqualTypeOf<
            InfiniteData<{ value: string }, number> | undefined
          >()
        })
      })

      describe('error', () => {
        it('should be typed from the observed error type', () => {
          expectTypeOf<
            InfiniteQueryObserverBaseResult<
              InfiniteData<{ value: string }, number>,
              CustomError
            >['error']
          >().toEqualTypeOf<CustomError | null>()
        })
      })
    })

    describe('InfiniteQueryObserverPendingResult', () => {
      it('should be extractable from the result union by its status and isLoading', () => {
        type Pending = Extract<
          InfiniteQueryObserverResult<InfiniteData<{ value: string }, number>>,
          { status: 'pending' }
        >

        expectTypeOf<
          FlagFor<Pending, typeof isPending<Pending>>
        >().toEqualTypeOf<true>()
      })

      it('should pin every flag along with its data and error types', () => {
        const observer = new InfiniteQueryObserver(queryClient, {
          queryKey: createKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
          initialPageParam: 1,
          getNextPageParam: () => 1,
        })

        const result = observer.getCurrentResult()

        if (isPending(result)) {
          expectTypeOf(result.data).toEqualTypeOf<undefined>()
          expectTypeOf(result.error).toEqualTypeOf<null>()
          expectTypeOf<
            FlagFor<typeof result, typeof isError<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<typeof result, typeof isPending<typeof result>>
          >().toEqualTypeOf<true>()
          expectTypeOf<
            FlagFor<typeof result, typeof isLoading<typeof result>>
          >().toEqualTypeOf<boolean>()
          expectTypeOf<
            FlagFor<typeof result, typeof isLoadingError<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<typeof result, typeof isRefetchError<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<typeof result, typeof isFetchNextPageError<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<
              typeof result,
              typeof isFetchPreviousPageError<typeof result>
            >
          >().toEqualTypeOf<false>()
          expectTypeOf(result.status).toEqualTypeOf<'pending'>()
          expectTypeOf(result.isPlaceholderData).toEqualTypeOf<false>()
        }
      })

      it('should declare exactly the base and narrowed keys', () => {
        expectTypeOf<keyof InfiniteQueryObserverPendingResult>().toEqualTypeOf<
          keyof InfiniteQueryObserverBaseResult
        >()
      })
    })

    describe('InfiniteQueryObserverLoadingResult', () => {
      it('should be extractable from the result union by its isLoading literal', () => {
        type Loading = Guarded<
          typeof isLoading<
            InfiniteQueryObserverResult<InfiniteData<{ value: string }, number>>
          >
        >

        expectTypeOf<
          FlagFor<Loading, typeof isLoading<Loading>>
        >().toEqualTypeOf<true>()
      })

      it('should pin every flag along with its data and error types', () => {
        const observer = new InfiniteQueryObserver(queryClient, {
          queryKey: createKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
          initialPageParam: 1,
          getNextPageParam: () => 1,
        })

        const result = observer.getCurrentResult()

        if (isLoading(result)) {
          expectTypeOf(result.data).toEqualTypeOf<undefined>()
          expectTypeOf(result.error).toEqualTypeOf<null>()
          expectTypeOf<
            FlagFor<typeof result, typeof isError<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<typeof result, typeof isPending<typeof result>>
          >().toEqualTypeOf<true>()
          expectTypeOf<
            FlagFor<typeof result, typeof isLoading<typeof result>>
          >().toEqualTypeOf<true>()
          expectTypeOf<
            FlagFor<typeof result, typeof isLoadingError<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<typeof result, typeof isRefetchError<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<typeof result, typeof isFetchNextPageError<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<
              typeof result,
              typeof isFetchPreviousPageError<typeof result>
            >
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<typeof result, typeof isSuccess<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf(result.status).toEqualTypeOf<'pending'>()
          expectTypeOf(result.isPlaceholderData).toEqualTypeOf<false>()
        }
      })

      it('should declare exactly the base and narrowed keys', () => {
        expectTypeOf<keyof InfiniteQueryObserverLoadingResult>().toEqualTypeOf<
          keyof InfiniteQueryObserverBaseResult
        >()
      })
    })

    describe('InfiniteQueryObserverLoadingErrorResult', () => {
      it('should be extractable from the result union by its isLoadingError literal', () => {
        type LoadingError = Guarded<
          typeof isLoadingError<
            InfiniteQueryObserverResult<InfiniteData<{ value: string }, number>>
          >
        >

        expectTypeOf<
          FlagFor<LoadingError, typeof isLoadingError<LoadingError>>
        >().toEqualTypeOf<true>()
      })

      it('should pin every flag along with its data and error types', () => {
        const observer = new InfiniteQueryObserver(queryClient, {
          queryKey: createKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
          initialPageParam: 1,
          getNextPageParam: () => 1,
        })

        const result = observer.getCurrentResult()

        if (isLoadingError(result)) {
          expectTypeOf(result.data).toEqualTypeOf<undefined>()
          expectTypeOf(result.error).toEqualTypeOf<DefaultError>()
          expectTypeOf<
            FlagFor<typeof result, typeof isError<typeof result>>
          >().toEqualTypeOf<true>()
          expectTypeOf<
            FlagFor<typeof result, typeof isPending<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<typeof result, typeof isLoading<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<typeof result, typeof isLoadingError<typeof result>>
          >().toEqualTypeOf<true>()
          expectTypeOf<
            FlagFor<typeof result, typeof isRefetchError<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<typeof result, typeof isFetchNextPageError<typeof result>>
          >().toEqualTypeOf<boolean>()
          expectTypeOf<
            FlagFor<
              typeof result,
              typeof isFetchPreviousPageError<typeof result>
            >
          >().toEqualTypeOf<boolean>()
          expectTypeOf<
            FlagFor<typeof result, typeof isSuccess<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf(result.status).toEqualTypeOf<'error'>()
          expectTypeOf(result.isPlaceholderData).toEqualTypeOf<false>()
        }
      })

      it('should declare exactly the base and narrowed keys', () => {
        expectTypeOf<
          keyof InfiniteQueryObserverLoadingErrorResult
        >().toEqualTypeOf<keyof InfiniteQueryObserverBaseResult>()
      })
    })

    describe('InfiniteQueryObserverRefetchErrorResult', () => {
      it('should be extractable from the result union by its isRefetchError literal', () => {
        type RefetchError = Guarded<
          typeof isRefetchError<
            InfiniteQueryObserverResult<InfiniteData<{ value: string }, number>>
          >
        >

        expectTypeOf<
          FlagFor<RefetchError, typeof isRefetchError<RefetchError>>
        >().toEqualTypeOf<true>()
      })

      it('should expose the page error types during a full refetch', () => {
        type RefetchError = Guarded<
          typeof isRefetchError<
            InfiniteQueryObserverResult<InfiniteData<{ value: string }, number>>
          >
        >

        expectTypeOf<
          FlagFor<RefetchError, typeof isFetchNextPageError<RefetchError>>
        >().toEqualTypeOf<false>()
        expectTypeOf<
          FlagFor<RefetchError, typeof isFetchPreviousPageError<RefetchError>>
        >().toEqualTypeOf<false>()
      })

      it('should pin every flag along with its data and error types', () => {
        const observer = new InfiniteQueryObserver(queryClient, {
          queryKey: createKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
          initialPageParam: 1,
          getNextPageParam: () => 1,
        })

        const result = observer.getCurrentResult()

        if (isRefetchError(result)) {
          expectTypeOf(result.data).toEqualTypeOf<
            InfiniteData<{ value: string }, unknown>
          >()
          expectTypeOf(result.error).toEqualTypeOf<DefaultError>()
          expectTypeOf<
            FlagFor<typeof result, typeof isError<typeof result>>
          >().toEqualTypeOf<true>()
          expectTypeOf<
            FlagFor<typeof result, typeof isPending<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<typeof result, typeof isLoading<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<typeof result, typeof isLoadingError<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<typeof result, typeof isRefetchError<typeof result>>
          >().toEqualTypeOf<true>()
          expectTypeOf<
            FlagFor<typeof result, typeof isSuccess<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf(result.status).toEqualTypeOf<'error'>()
          expectTypeOf(result.isPlaceholderData).toEqualTypeOf<false>()
        }
      })

      it('should declare exactly the base and narrowed keys', () => {
        expectTypeOf<
          keyof InfiniteQueryObserverRefetchErrorResult
        >().toEqualTypeOf<keyof InfiniteQueryObserverBaseResult>()
      })
    })

    describe('InfiniteQueryObserverSuccessResult', () => {
      it('should be extractable from the result union by its status and isPlaceholderData', () => {
        type Success = Extract<
          InfiniteQueryObserverResult<InfiniteData<{ value: string }, number>>,
          { status: 'success'; isPlaceholderData: false }
        >

        expectTypeOf<
          FlagFor<Success, typeof isSuccess<Success>>
        >().toEqualTypeOf<true>()
      })

      it('should pin every flag along with its data and error types', () => {
        const observer = new InfiniteQueryObserver(queryClient, {
          queryKey: createKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
          initialPageParam: 1,
          getNextPageParam: () => 1,
        })

        const result = observer.getCurrentResult()

        if (isSuccess(result)) {
          expectTypeOf(result.data).toEqualTypeOf<
            InfiniteData<{ value: string }, unknown>
          >()
          expectTypeOf(result.error).toEqualTypeOf<null>()
          expectTypeOf<
            FlagFor<typeof result, typeof isError<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<typeof result, typeof isPending<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<typeof result, typeof isLoading<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<typeof result, typeof isLoadingError<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<typeof result, typeof isRefetchError<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<typeof result, typeof isFetchNextPageError<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<
              typeof result,
              typeof isFetchPreviousPageError<typeof result>
            >
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<typeof result, typeof isSuccess<typeof result>>
          >().toEqualTypeOf<true>()
          expectTypeOf(result.status).toEqualTypeOf<'success'>()
          expectTypeOf(result.isPlaceholderData).toEqualTypeOf<boolean>()
        }
      })

      it('should declare exactly the base and narrowed keys', () => {
        expectTypeOf<keyof InfiniteQueryObserverSuccessResult>().toEqualTypeOf<
          keyof InfiniteQueryObserverBaseResult
        >()
      })
    })

    describe('InfiniteQueryObserverPlaceholderResult', () => {
      it('should be extractable from the result union by its isPlaceholderData literal', () => {
        type Placeholder = Extract<
          InfiniteQueryObserverResult<InfiniteData<{ value: string }, number>>,
          { isPlaceholderData: true }
        >

        expectTypeOf<Placeholder['isPlaceholderData']>().toEqualTypeOf<true>()
      })

      it('should pin every flag along with its data and error types', () => {
        const observer = new InfiniteQueryObserver(queryClient, {
          queryKey: createKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
          initialPageParam: 1,
          getNextPageParam: () => 1,
        })

        const result = observer.getCurrentResult()

        if (result.isPlaceholderData) {
          expectTypeOf(result.data).toEqualTypeOf<
            InfiniteData<{ value: string }, unknown>
          >()
          expectTypeOf(result.error).toEqualTypeOf<null>()
          expectTypeOf<
            FlagFor<typeof result, typeof isError<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<typeof result, typeof isPending<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<typeof result, typeof isLoading<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<typeof result, typeof isLoadingError<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<typeof result, typeof isRefetchError<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<typeof result, typeof isFetchNextPageError<typeof result>>
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<
              typeof result,
              typeof isFetchPreviousPageError<typeof result>
            >
          >().toEqualTypeOf<false>()
          expectTypeOf<
            FlagFor<typeof result, typeof isSuccess<typeof result>>
          >().toEqualTypeOf<true>()
          expectTypeOf(result.status).toEqualTypeOf<'success'>()
          expectTypeOf(result.isPlaceholderData).toEqualTypeOf<true>()
        }
      })

      it('should declare exactly the base and narrowed keys', () => {
        expectTypeOf<
          keyof InfiniteQueryObserverPlaceholderResult
        >().toEqualTypeOf<keyof InfiniteQueryObserverBaseResult>()
      })
    })

    describe('DefinedInfiniteQueryObserverResult', () => {
      it('should only hold the branches that always have data', () => {
        expectTypeOf<
          DefinedInfiniteQueryObserverResult<
            InfiniteData<{ value: string }, number>,
            CustomError
          >
        >().toEqualTypeOf<
          | InfiniteQueryObserverRefetchErrorResult<
              InfiniteData<{ value: string }, number>,
              CustomError
            >
          | InfiniteQueryObserverSuccessResult<
              InfiniteData<{ value: string }, number>,
              CustomError
            >
        >()
      })

      it('should always define the paged data on every one of its branches', () => {
        expectTypeOf<
          DefinedInfiniteQueryObserverResult<
            InfiniteData<{ value: string }, number>
          >['data']
        >().toEqualTypeOf<InfiniteData<{ value: string }, number>>()
      })

      it('should be a subset of the result union', () => {
        expectTypeOf<
          Exclude<
            DefinedInfiniteQueryObserverResult<
              InfiniteData<{ value: string }, number>
            >,
            InfiniteQueryObserverResult<InfiniteData<{ value: string }, number>>
          >
        >().toEqualTypeOf<never>()
      })

      it('should default its data to unknown and its error to the default error', () => {
        expectTypeOf<DefinedInfiniteQueryObserverResult>().toEqualTypeOf<
          DefinedInfiniteQueryObserverResult<unknown, DefaultError>
        >()
      })
    })
  })

  describe('FetchNextPageOptions', () => {
    it('should be typed as its literal shape', () => {
      expectTypeOf<FetchNextPageOptions>().toEqualTypeOf<{
        throwOnError?: boolean
        cancelRefetch?: boolean
      }>()
    })
  })

  describe('FetchPreviousPageOptions', () => {
    it('should be typed as its literal shape', () => {
      expectTypeOf<FetchPreviousPageOptions>().toEqualTypeOf<{
        throwOnError?: boolean
        cancelRefetch?: boolean
      }>()
    })
  })

  describe('setOptions', () => {
    it('should keep the paged data type in the options it is given', () => {
      const observer = new InfiniteQueryObserver(queryClient, {
        queryKey: createKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      observer.setOptions({
        queryKey: createKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
        initialPageParam: 1,
        getNextPageParam: () => 1,
        select: [
          select,
          (data) => {
            expectTypeOf(data).toEqualTypeOf<
              InfiniteData<{ value: string }, number>
            >()
            return data
          },
        ],
      })

      observer.setOptions({
        queryKey: createKey(),
        initialPageParam: 1,
        getNextPageParam: () => 1,
        // @ts-expect-error the queryFn must return the observed page data type
        queryFn: () => 42,
      })
    })

    it('should return void', () => {
      const observer = new InfiniteQueryObserver(queryClient, {
        queryKey: createKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      expectTypeOf(observer.setOptions).returns.toEqualTypeOf<void>()
    })
  })

  describe('options', () => {
    it('should leave the page param of the queryFn context unknown', () => {
      const observer = new InfiniteQueryObserver(queryClient, {
        queryKey: createKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      type Context = Parameters<
        Extract<typeof observer.options.queryFn, (...args: Array<any>) => any>
      >[0]

      expectTypeOf<Context['pageParam']>().toEqualTypeOf<unknown>()
    })

    it('should expose the paged data type through the options it holds', () => {
      const observer = new InfiniteQueryObserver(queryClient, {
        queryKey: createKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      expectTypeOf(observer.options.select?.[1]).toEqualTypeOf<
        | ((
            data: InfiniteData<{ value: string }, number>,
          ) => InfiniteData<{ value: string }, unknown>)
        | undefined
      >()
    })
  })

  describe('getCurrentResult', () => {
    it('should be typed from the observed types', () => {
      const observer = new InfiniteQueryObserver(queryClient, {
        queryKey: createKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      expectTypeOf(observer.getCurrentResult()).toEqualTypeOf<
        InfiniteQueryObserverResult<
          InfiniteData<{ value: string }, unknown>,
          DefaultError
        >
      >()
    })

    it('should carry a custom error type into the result', () => {
      const observer = new InfiniteQueryObserver<
        { value: string },
        CustomError
      >(queryClient, {
        queryKey: createKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      expectTypeOf(observer.getCurrentResult()).toEqualTypeOf<
        InfiniteQueryObserverResult<
          InfiniteData<{ value: string }, unknown>,
          CustomError
        >
      >()
    })
  })

  describe('getCurrentQuery', () => {
    it('should carry the paged data into the query state', () => {
      const observer = new InfiniteQueryObserver(queryClient, {
        queryKey: createKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      expectTypeOf(observer.getCurrentQuery().state.data).toEqualTypeOf<
        InfiniteData<{ value: string }, number> | undefined
      >()
    })

    it('should type the fetchMeta of the query state as the fetch direction', () => {
      const observer = new InfiniteQueryObserver(queryClient, {
        queryKey: createKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      expectTypeOf(observer.getCurrentQuery().state.fetchMeta).toEqualTypeOf<{
        fetchMore?: { direction: 'forward' | 'backward' }
      } | null>()
    })
  })

  describe('fetchNextPage', () => {
    it('should resolve with the infinite result type', () => {
      const observer = new InfiniteQueryObserver(queryClient, {
        queryKey: createKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      expectTypeOf(observer.fetchNextPage()).resolves.toEqualTypeOf<
        InfiniteQueryObserverResult<
          InfiniteData<{ value: string }, unknown>,
          DefaultError
        >
      >()
    })

    it('should only accept FetchNextPageOptions', () => {
      const observer = new InfiniteQueryObserver(queryClient, {
        queryKey: createKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      // @ts-expect-error fetchNextPage does not accept a page param
      observer.fetchNextPage({ pageParam: 1 })

      expectTypeOf(observer.fetchNextPage).parameters.toEqualTypeOf<
        [options?: FetchNextPageOptions]
      >()
    })
  })

  describe('fetchPreviousPage', () => {
    it('should resolve with the infinite result type', () => {
      const observer = new InfiniteQueryObserver(queryClient, {
        queryKey: createKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      expectTypeOf(observer.fetchPreviousPage()).resolves.toEqualTypeOf<
        InfiniteQueryObserverResult<
          InfiniteData<{ value: string }, unknown>,
          DefaultError
        >
      >()
    })

    it('should only accept FetchPreviousPageOptions', () => {
      const observer = new InfiniteQueryObserver(queryClient, {
        queryKey: createKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      // @ts-expect-error fetchPreviousPage does not accept a page param
      observer.fetchPreviousPage({ pageParam: 1 })

      expectTypeOf(observer.fetchPreviousPage).parameters.toEqualTypeOf<
        [options?: FetchPreviousPageOptions]
      >()
    })
  })

  describe('refetch', () => {
    it('should resolve with the base result rather than the infinite one', () => {
      const observer = new InfiniteQueryObserver(queryClient, {
        queryKey: createKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      expectTypeOf(observer.refetch()).resolves.toEqualTypeOf<
        QueryObserverResult<
          InfiniteData<{ value: string }, unknown>,
          DefaultError
        >
      >()
    })
  })

  describe('subscribe', () => {
    it('should infer the infinite result type in the listener', () => {
      const observer = new InfiniteQueryObserver(queryClient, {
        queryKey: createKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      observer.subscribe((result) => {
        expectTypeOf(result).toEqualTypeOf<
          InfiniteQueryObserverResult<
            InfiniteData<{ value: string }, unknown>,
            DefaultError
          >
        >()
      })
    })

    it('should return an unsubscribe function', () => {
      const observer = new InfiniteQueryObserver(queryClient, {
        queryKey: createKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      expectTypeOf(observer.subscribe(() => {})).toEqualTypeOf<() => void>()
    })
  })

  describe('trackResult', () => {
    it('should widen the infinite result it is given to the base result', () => {
      const observer = new InfiniteQueryObserver(queryClient, {
        queryKey: createKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      expectTypeOf(
        observer.trackResult(observer.getCurrentResult()),
      ).toEqualTypeOf<
        QueryObserverResult<
          InfiniteData<{ value: string }, unknown>,
          DefaultError
        >
      >()
    })
  })
})
