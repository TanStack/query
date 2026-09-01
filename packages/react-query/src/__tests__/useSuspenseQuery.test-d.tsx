import { assertType, describe, expectTypeOf, it } from 'vitest'
import { keepPreviousData, skipToken } from '@tanstack/query-core'
import { queryKey } from '@tanstack/query-test-utils'
import { useSuspenseQuery } from '../useSuspenseQuery'

describe('useSuspenseQuery', () => {
  it('should always have data defined', () => {
    const { data } = useSuspenseQuery({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
    })

    expectTypeOf(data).toEqualTypeOf<number>()
  })

  it('should not have pending status', () => {
    const { status } = useSuspenseQuery({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
    })

    expectTypeOf(status).toEqualTypeOf<'error' | 'success'>()
  })

  it('should not allow skipToken in queryFn', () => {
    assertType(
      useSuspenseQuery({
        queryKey: queryKey(),
        // @ts-expect-error
        queryFn: skipToken,
      }),
    )
    assertType(
      useSuspenseQuery({
        queryKey: queryKey(),
        // @ts-expect-error
        queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
      }),
    )
  })

  it('should allow placeholderData', () => {
    const query = useSuspenseQuery({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
      placeholderData: (previousData, previousQuery) => {
        expectTypeOf(previousData).toEqualTypeOf<number | undefined>()
        expectTypeOf(previousQuery).not.toBeAny()
        return previousData ?? 0
      },
    })

    expectTypeOf(query.data).toEqualTypeOf<number>()
    expectTypeOf(query.isPlaceholderData).toEqualTypeOf<boolean>()

    assertType(
      useSuspenseQuery({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve(5),
        placeholderData: keepPreviousData,
      }),
    )

    const selected = useSuspenseQuery({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
      placeholderData: 0,
      select: (data) => data.toString(),
    })

    expectTypeOf(selected.data).toEqualTypeOf<string>()

    if (query.isPlaceholderData) {
      expectTypeOf(query.status).toEqualTypeOf<'success'>()
      expectTypeOf(query.error).toEqualTypeOf<null>()
    }
  })

  it('should not allow enabled or throwOnError props', () => {
    assertType(
      useSuspenseQuery({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve(5),
        placeholderData: 5,
        // @ts-expect-error TS2345
        enabled: true,
      }),
    )
    assertType(
      useSuspenseQuery({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve(5),
        // @ts-expect-error TS2345
        enabled: true,
      }),
    )
    assertType(
      useSuspenseQuery({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve(5),
        // @ts-expect-error TS2345
        throwOnError: true,
      }),
    )
  })

  it('should return isPlaceholderData', () => {
    expectTypeOf(
      useSuspenseQuery({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve(5),
      }),
    ).toHaveProperty('isPlaceholderData')
  })

  it('should type-narrow the error field', () => {
    const query = useSuspenseQuery({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
    })

    if (query.status === 'error') {
      expectTypeOf(query.error).toEqualTypeOf<Error>()
    }
  })
})
