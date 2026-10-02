import { afterEach, beforeEach, describe, expectTypeOf, it } from 'vitest'
import { queryKey } from '@tanstack/query-test-utils'
import { InfiniteQueryObserver, QueryClient } from '..'
import type {
  DefaultError,
  DefaultedInfiniteQueryObserverOptions,
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
} from '..'
import type { QueryBehavior } from '../query'

class CustomError extends Error {
  name = 'CustomError' as const
}

describe('infiniteQueryObserver', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
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
          queryKey: queryKey(),
          queryFn: () => Promise.resolve('data'),
          getNextPageParam: () => 1,
        })

        expectTypeOf(
          new InfiniteQueryObserver(queryClient, {
            queryKey: queryKey(),
            queryFn: () => Promise.resolve('data'),
            initialPageParam: 1,
            getNextPageParam: () => 1,
          }),
        ).toBeObject()
      })

      it('should widen a literal to its base type', () => {
        const observer = new InfiniteQueryObserver(queryClient, {
          queryKey: queryKey(),
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
          queryKey: queryKey(),
          queryFn: () => Promise.resolve('data'),
          initialPageParam: 1,
        })

        expectTypeOf(
          new InfiniteQueryObserver(queryClient, {
            queryKey: queryKey(),
            queryFn: () => Promise.resolve('data'),
            initialPageParam: 1,
            getNextPageParam: () => 1,
          }),
        ).toBeObject()
      })

      it('should type the pages and page params it is given', () => {
        new InfiniteQueryObserver(queryClient, {
          queryKey: queryKey(),
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
          queryKey: queryKey(),
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

    describe('behavior', () => {
      it('should be typed from the paged data it produces', () => {
        expectTypeOf<
          InfiniteQueryObserverOptions<
            { value: string },
            CustomError,
            InfiniteData<{ value: string }, number>,
            ReadonlyArray<unknown>,
            number
          >['behavior']
        >().toEqualTypeOf<
          | QueryBehavior<
              { value: string },
              CustomError,
              InfiniteData<{ value: string }, number>,
              ReadonlyArray<unknown>
            >
          | undefined
        >()
      })

      it('should only accept an object with an onFetch callback', () => {
        expectTypeOf<
          InfiniteQueryObserverOptions<{ value: string }>['behavior']
        >()
          .exclude<undefined>()
          .toHaveProperty('onFetch')
          .toBeFunction()
      })
    })

    describe('queryFn', () => {
      it('should type the page param of the context it is given', () => {
        new InfiniteQueryObserver(queryClient, {
          queryKey: queryKey(),
          initialPageParam: 1,
          getNextPageParam: () => 1,
          queryFn: (context) => {
            expectTypeOf(context.pageParam).toEqualTypeOf<number>()
            return Promise.resolve('data')
          },
        })
      })

      it('should type the direction of the context it is given', () => {
        new InfiniteQueryObserver(queryClient, {
          queryKey: queryKey(),
          initialPageParam: 1,
          getNextPageParam: () => 1,
          queryFn: (context) => {
            expectTypeOf(context.direction).toEqualTypeOf<
              'forward' | 'backward'
            >()
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
        expectTypeOf<
          'direction' extends OptionalKeys ? true : false
        >().toEqualTypeOf<false>()
      })

      it('should leave the page param unknown on an unpaged context type', () => {
        expectTypeOf<
          QueryFunctionContext<ReadonlyArray<unknown>>['pageParam']
        >().toEqualTypeOf<unknown>()
        expectTypeOf<
          QueryFunctionContext<ReadonlyArray<unknown>>['direction']
        >().toEqualTypeOf<unknown>()
      })
    })

    describe('persister', () => {
      it('should type the page param of the queryFn it is given', () => {
        new InfiniteQueryObserver(queryClient, {
          queryKey: queryKey(),
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
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
          initialPageParam: 1,
          getNextPageParam: () => 1,
          select: (data) => {
            expectTypeOf(data).toEqualTypeOf<
              InfiniteData<{ value: string }, number>
            >()
            return data.pages
          },
        })
      })

      it('should type the result data as what select returns', () => {
        const observer = new InfiniteQueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ count: 1 }),
          initialPageParam: 1,
          getNextPageParam: () => 1,
          select: (data) => data.pages.length,
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
          | 'isFetchNextPageError'
          | 'isFetchPreviousPageError'
          | 'isFetchingNextPage'
          | 'isFetchingPreviousPage'
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

        expectTypeOf<
          Branch<{ status: 'pending'; isLoading: boolean }>
        >().toEqualTypeOf<
          Writable<Branch<{ status: 'pending'; isLoading: boolean }>>
        >()
        expectTypeOf<Branch<{ isLoading: true }>>().toEqualTypeOf<
          Writable<Branch<{ isLoading: true }>>
        >()
        expectTypeOf<Branch<{ isLoadingError: true }>>().toEqualTypeOf<
          Writable<Branch<{ isLoadingError: true }>>
        >()
        expectTypeOf<Branch<{ isRefetchError: true }>>().toEqualTypeOf<
          Writable<Branch<{ isRefetchError: true }>>
        >()
        expectTypeOf<Branch<{ isSuccess: true }>>().toEqualTypeOf<
          Writable<Branch<{ isSuccess: true }>>
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
            InfiniteQueryObserverBaseResult<
              InfiniteData<{ value: string }, number>,
              CustomError
            >['isFetchNextPageError']
          >().toEqualTypeOf<boolean>()
        })
      })

      describe('isFetchPreviousPageError', () => {
        it('should be typed as a boolean', () => {
          expectTypeOf<
            InfiniteQueryObserverBaseResult<
              InfiniteData<{ value: string }, number>,
              CustomError
            >['isFetchPreviousPageError']
          >().toEqualTypeOf<boolean>()
        })
      })

      describe('isFetchingNextPage', () => {
        it('should be typed as a boolean', () => {
          expectTypeOf<
            InfiniteQueryObserverBaseResult<
              InfiniteData<{ value: string }, number>,
              CustomError
            >['isFetchingNextPage']
          >().toEqualTypeOf<boolean>()
        })
      })

      describe('isFetchingPreviousPage', () => {
        it('should be typed as a boolean', () => {
          expectTypeOf<
            InfiniteQueryObserverBaseResult<
              InfiniteData<{ value: string }, number>,
              CustomError
            >['isFetchingPreviousPage']
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
          { status: 'pending'; isLoading: boolean }
        >

        expectTypeOf<Pending['isPending']>().toEqualTypeOf<true>()
      })

      it('should pin every flag along with its data and error types', () => {
        const observer = new InfiniteQueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
          initialPageParam: 1,
          getNextPageParam: () => 1,
        })

        const result = observer.getCurrentResult()

        if (result.isPending) {
          expectTypeOf(result.data).toEqualTypeOf<undefined>()
          expectTypeOf(result.error).toEqualTypeOf<null>()
          expectTypeOf(result.isError).toEqualTypeOf<false>()
          expectTypeOf(result.isPending).toEqualTypeOf<true>()
          expectTypeOf(result.isLoading).toEqualTypeOf<boolean>()
          expectTypeOf(result.isLoadingError).toEqualTypeOf<false>()
          expectTypeOf(result.isRefetchError).toEqualTypeOf<false>()
          expectTypeOf(result.isFetchNextPageError).toEqualTypeOf<false>()
          expectTypeOf(result.isFetchPreviousPageError).toEqualTypeOf<false>()
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
        type Loading = Extract<
          InfiniteQueryObserverResult<InfiniteData<{ value: string }, number>>,
          { isLoading: true }
        >

        expectTypeOf<Loading['isLoading']>().toEqualTypeOf<true>()
      })

      it('should pin every flag along with its data and error types', () => {
        const observer = new InfiniteQueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
          initialPageParam: 1,
          getNextPageParam: () => 1,
        })

        const result = observer.getCurrentResult()

        if (result.isLoading) {
          expectTypeOf(result.data).toEqualTypeOf<undefined>()
          expectTypeOf(result.error).toEqualTypeOf<null>()
          expectTypeOf(result.isError).toEqualTypeOf<false>()
          expectTypeOf(result.isPending).toEqualTypeOf<true>()
          expectTypeOf(result.isLoading).toEqualTypeOf<true>()
          expectTypeOf(result.isLoadingError).toEqualTypeOf<false>()
          expectTypeOf(result.isRefetchError).toEqualTypeOf<false>()
          expectTypeOf(result.isFetchNextPageError).toEqualTypeOf<false>()
          expectTypeOf(result.isFetchPreviousPageError).toEqualTypeOf<false>()
          expectTypeOf(result.isSuccess).toEqualTypeOf<false>()
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
        type LoadingError = Extract<
          InfiniteQueryObserverResult<InfiniteData<{ value: string }, number>>,
          { isLoadingError: true }
        >

        expectTypeOf<LoadingError['isLoadingError']>().toEqualTypeOf<true>()
      })

      it('should pin every flag along with its data and error types', () => {
        const observer = new InfiniteQueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
          initialPageParam: 1,
          getNextPageParam: () => 1,
        })

        const result = observer.getCurrentResult()

        if (result.isLoadingError) {
          expectTypeOf(result.data).toEqualTypeOf<undefined>()
          expectTypeOf(result.error).toEqualTypeOf<DefaultError>()
          expectTypeOf(result.isError).toEqualTypeOf<true>()
          expectTypeOf(result.isPending).toEqualTypeOf<false>()
          expectTypeOf(result.isLoading).toEqualTypeOf<false>()
          expectTypeOf(result.isLoadingError).toEqualTypeOf<true>()
          expectTypeOf(result.isRefetchError).toEqualTypeOf<false>()
          expectTypeOf(result.isFetchNextPageError).toEqualTypeOf<false>()
          expectTypeOf(result.isFetchPreviousPageError).toEqualTypeOf<false>()
          expectTypeOf(result.isSuccess).toEqualTypeOf<false>()
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
        type RefetchError = Extract<
          InfiniteQueryObserverResult<InfiniteData<{ value: string }, number>>,
          { isRefetchError: true }
        >

        expectTypeOf<RefetchError['isRefetchError']>().toEqualTypeOf<true>()
      })

      it('should leave the page error flags unpinned', () => {
        type RefetchError = Extract<
          InfiniteQueryObserverResult<InfiniteData<{ value: string }, number>>,
          { isRefetchError: true }
        >

        expectTypeOf<
          RefetchError['isFetchNextPageError']
        >().toEqualTypeOf<boolean>()
        expectTypeOf<
          RefetchError['isFetchPreviousPageError']
        >().toEqualTypeOf<boolean>()
      })

      it('should pin every flag along with its data and error types', () => {
        const observer = new InfiniteQueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
          initialPageParam: 1,
          getNextPageParam: () => 1,
        })

        const result = observer.getCurrentResult()

        if (result.isRefetchError) {
          expectTypeOf(result.data).toEqualTypeOf<
            InfiniteData<{ value: string }, unknown>
          >()
          expectTypeOf(result.error).toEqualTypeOf<DefaultError>()
          expectTypeOf(result.isError).toEqualTypeOf<true>()
          expectTypeOf(result.isPending).toEqualTypeOf<false>()
          expectTypeOf(result.isLoading).toEqualTypeOf<false>()
          expectTypeOf(result.isLoadingError).toEqualTypeOf<false>()
          expectTypeOf(result.isRefetchError).toEqualTypeOf<true>()
          expectTypeOf(result.isSuccess).toEqualTypeOf<false>()
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

        expectTypeOf<Success['isSuccess']>().toEqualTypeOf<true>()
      })

      it('should pin every flag along with its data and error types', () => {
        const observer = new InfiniteQueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
          initialPageParam: 1,
          getNextPageParam: () => 1,
        })

        const result = observer.getCurrentResult()

        if (result.isSuccess) {
          expectTypeOf(result.data).toEqualTypeOf<
            InfiniteData<{ value: string }, unknown>
          >()
          expectTypeOf(result.error).toEqualTypeOf<null>()
          expectTypeOf(result.isError).toEqualTypeOf<false>()
          expectTypeOf(result.isPending).toEqualTypeOf<false>()
          expectTypeOf(result.isLoading).toEqualTypeOf<false>()
          expectTypeOf(result.isLoadingError).toEqualTypeOf<false>()
          expectTypeOf(result.isRefetchError).toEqualTypeOf<false>()
          expectTypeOf(result.isFetchNextPageError).toEqualTypeOf<false>()
          expectTypeOf(result.isFetchPreviousPageError).toEqualTypeOf<false>()
          expectTypeOf(result.isSuccess).toEqualTypeOf<true>()
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
          queryKey: queryKey(),
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
          expectTypeOf(result.isError).toEqualTypeOf<false>()
          expectTypeOf(result.isPending).toEqualTypeOf<false>()
          expectTypeOf(result.isLoading).toEqualTypeOf<false>()
          expectTypeOf(result.isLoadingError).toEqualTypeOf<false>()
          expectTypeOf(result.isRefetchError).toEqualTypeOf<false>()
          expectTypeOf(result.isFetchNextPageError).toEqualTypeOf<false>()
          expectTypeOf(result.isFetchPreviousPageError).toEqualTypeOf<false>()
          expectTypeOf(result.isSuccess).toEqualTypeOf<true>()
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
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      observer.setOptions({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
        initialPageParam: 1,
        getNextPageParam: () => 1,
        select: (data) => {
          expectTypeOf(data).toEqualTypeOf<
            InfiniteData<{ value: string }, number>
          >()
          return data
        },
      })

      observer.setOptions({
        queryKey: queryKey(),
        initialPageParam: 1,
        getNextPageParam: () => 1,
        // @ts-expect-error the queryFn must return the observed page data type
        queryFn: () => 42,
      })
    })

    it('should return void', () => {
      const observer = new InfiniteQueryObserver(queryClient, {
        queryKey: queryKey(),
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
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      type Context = Parameters<
        Extract<typeof observer.options.queryFn, Function>
      >[0]

      expectTypeOf<Context['pageParam']>().toEqualTypeOf<unknown>()
      expectTypeOf<Context['direction']>().toEqualTypeOf<unknown>()
    })

    it('should expose the paged data type through the options it holds', () => {
      const observer = new InfiniteQueryObserver(queryClient, {
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      expectTypeOf(observer.options.select).toEqualTypeOf<
        | ((
            data: InfiniteData<{ value: string }, number>,
          ) => InfiniteData<{ value: string }, unknown>)
        | undefined
      >()
    })
  })

  describe('getOptimisticResult', () => {
    it('should be typed from the options it is given', () => {
      const observer = new InfiniteQueryObserver(queryClient, {
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      const options: DefaultedInfiniteQueryObserverOptions<
        { value: string },
        DefaultError,
        InfiniteData<{ value: string }, unknown>,
        Array<string>,
        number
      > = {
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
        initialPageParam: 1,
        getNextPageParam: () => 1,
        queryHash: 'hash',
        throwOnError: false,
        refetchOnReconnect: true,
      }

      expectTypeOf(observer.getOptimisticResult(options)).toEqualTypeOf<
        InfiniteQueryObserverResult<
          InfiniteData<{ value: string }, unknown>,
          DefaultError
        >
      >()
    })

    it('should require the options that are always defaulted', () => {
      const observer = new InfiniteQueryObserver(queryClient, {
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      type Options = Parameters<typeof observer.getOptimisticResult>[0]
      type OptionalKeys = {
        [K in keyof Options]-?: {} extends Pick<Options, K> ? K : never
      }[keyof Options]

      expectTypeOf<
        'throwOnError' extends OptionalKeys ? true : false
      >().toEqualTypeOf<false>()
      expectTypeOf<
        'refetchOnReconnect' extends OptionalKeys ? true : false
      >().toEqualTypeOf<false>()
      expectTypeOf<
        'queryHash' extends OptionalKeys ? true : false
      >().toEqualTypeOf<false>()
      expectTypeOf<
        'initialPageParam' extends OptionalKeys ? true : false
      >().toEqualTypeOf<false>()
      expectTypeOf<
        'getNextPageParam' extends OptionalKeys ? true : false
      >().toEqualTypeOf<false>()
    })
  })

  describe('getCurrentResult', () => {
    it('should be typed from the observed types', () => {
      const observer = new InfiniteQueryObserver(queryClient, {
        queryKey: queryKey(),
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
        queryKey: queryKey(),
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
        queryKey: queryKey(),
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
        queryKey: queryKey(),
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
        queryKey: queryKey(),
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
        queryKey: queryKey(),
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
        queryKey: queryKey(),
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
        queryKey: queryKey(),
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
        queryKey: queryKey(),
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
        queryKey: queryKey(),
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
        queryKey: queryKey(),
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
        queryKey: queryKey(),
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
