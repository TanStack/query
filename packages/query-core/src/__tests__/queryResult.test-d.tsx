import { describe, expectTypeOf, it } from 'vitest'
import {
  isError,
  isFetchPreviousPageError,
  isFetchingNextPage,
  isLoading,
  isLoadingError,
  isPending,
  isRefetchError,
  isSuccess,
} from '../queryResult'
import type {
  DefinedQueryObserverResult,
  InfiniteData,
  InfiniteQueryObserverResult,
  QueryObserverResult,
} from '../types'

describe('query result type guards', () => {
  it('narrows regular, nullable, defined and infinite results without losing their types', () => {
    const regular = {} as QueryObserverResult<string | null, RangeError>
    if (isPending(regular)) {
      expectTypeOf(regular.data).toEqualTypeOf<undefined>()
      expectTypeOf(regular.error).toEqualTypeOf<null>()
    }
    if (isLoading(regular))
      expectTypeOf(regular.fetchStatus).toEqualTypeOf<'fetching'>()
    if (isError(regular))
      expectTypeOf(regular.error).toEqualTypeOf<RangeError>()
    if (isLoadingError(regular))
      expectTypeOf(regular.data).toEqualTypeOf<undefined>()
    if (isRefetchError(regular))
      expectTypeOf(regular.data).toEqualTypeOf<string | null>()
    if (!isPending(regular) && !isError(regular))
      expectTypeOf(regular.data).toEqualTypeOf<string | null>()
    const selected = {} as DefinedQueryObserverResult<
      string | undefined,
      RangeError
    >
    if (isSuccess(selected))
      expectTypeOf(selected.data).toEqualTypeOf<string | undefined>()
    const pages = {} as InfiniteQueryObserverResult<
      InfiniteData<number, string>,
      RangeError
    >
    if (isSuccess(pages)) {
      expectTypeOf(pages.data.pages).toEqualTypeOf<Array<number>>()
      expectTypeOf(pages.data.pageParams).toEqualTypeOf<Array<string>>()
      expectTypeOf(pages.fetchNextPage).toEqualTypeOf<
        typeof pages.fetchPreviousPage
      >()
    }
    if (isFetchPreviousPageError(pages)) {
      expectTypeOf(pages.error).toEqualTypeOf<RangeError>()
      expectTypeOf(pages.fetchDirection).toEqualTypeOf<'backward'>()
    }
    if (isFetchingNextPage(pages))
      expectTypeOf(pages.fetchDirection).toEqualTypeOf<'forward'>()
  })
})
