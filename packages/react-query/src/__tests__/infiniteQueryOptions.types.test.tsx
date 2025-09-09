import { expectTypeOf } from 'expect-type'
import {
  type InfiniteData,
  type UseInfiniteQueryResult,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { useSuspenseInfiniteQuery } from '../useSuspenseInfiniteQuery'
import { infiniteQueryOptions } from '../infiniteQueryOptions'
import { doNotExecute } from './utils'
import type {
  DefinedUseInfiniteQueryResult,
  UseSuspenseInfiniteQueryResult,
} from '../types'

const infiniteQuery = {
  options: () =>
    infiniteQueryOptions({
      queryKey: ['key', 1] as const,
      queryFn: () => Promise.resolve({ field: 'success' }),
    }),
  optionsWithInitialData: () =>
    infiniteQueryOptions({
      queryKey: ['key', 2] as const,
      queryFn: () => Promise.resolve({ field: 'success' }),
      initialData: () => ({ pageParams: [], pages: [{ field: 'success' }] }),
    }),
}

describe('infiniteQueryOptions', () => {
  it('should be used with useInfiniteQuery', () => {
    doNotExecute(() => {
      expectTypeOf(useInfiniteQuery(infiniteQuery.options())).toEqualTypeOf<
        UseInfiniteQueryResult<{ field: string }>
      >()

      expectTypeOf(
        useInfiniteQuery({
          ...infiniteQuery.options(),
          select: (data) => ({
            pages: data.pages.map(({ field }) => field),
            pageParams: data.pageParams,
          }),
        }),
      ).toEqualTypeOf<UseInfiniteQueryResult<string>>()

      expectTypeOf(
        useInfiniteQuery(infiniteQuery.optionsWithInitialData()),
      ).toEqualTypeOf<DefinedUseInfiniteQueryResult<{ field: string }>>()

      expectTypeOf(
        useInfiniteQuery({
          ...infiniteQuery.optionsWithInitialData(),
          select: (data) => ({
            pages: data.pages.map(({ field }) => field),
            pageParams: data.pageParams,
          }),
        }),
      ).toEqualTypeOf<DefinedUseInfiniteQueryResult<string>>()

      expectTypeOf(
        useInfiniteQuery({
          queryKey: ['key', 2] as const,
          queryFn: () => Promise.resolve({ field: 'success' }),
          initialData: () => ({
            pages: [{ field: 'success' }],
            pageParams: [],
          }),
          select: (data) => ({
            pages: data.pages.map(({ field }) => field),
            pageParams: data.pageParams,
          }),
        }),
      ).toEqualTypeOf<DefinedUseInfiniteQueryResult<string>>()
    })
  })
  it('should be used with useSuspenseInfiniteQuery', () => {
    doNotExecute(() => {
      expectTypeOf(
        useSuspenseInfiniteQuery(infiniteQuery.options()),
      ).toEqualTypeOf<UseSuspenseInfiniteQueryResult<{ field: string }>>()

      expectTypeOf(
        useSuspenseInfiniteQuery({
          ...infiniteQuery.options(),
          select: (data) => ({
            pages: data.pages.map(({ field }) => field),
            pageParams: data.pageParams,
          }),
        }),
      ).toEqualTypeOf<UseSuspenseInfiniteQueryResult<string>>()
    })
  })
  it('should be used with useQueryClient', () => {
    doNotExecute(async () => {
      const queryClient = useQueryClient()

      queryClient.invalidateQueries(infiniteQuery.options())
      queryClient.resetQueries(infiniteQuery.options())
      queryClient.removeQueries(infiniteQuery.options())
      queryClient.cancelQueries(infiniteQuery.options())
      queryClient.prefetchQuery(infiniteQuery.options())
      queryClient.refetchQueries(infiniteQuery.options())

      expectTypeOf(
        await queryClient.fetchQuery(infiniteQuery.options()),
      ).toEqualTypeOf<InfiniteData<{ field: string }>>()
    })
  })
})
