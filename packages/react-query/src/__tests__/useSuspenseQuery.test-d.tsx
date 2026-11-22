import { keepPreviousData, skipToken } from '@tanstack/query-core'
import { createKey } from '@tanstack/query-test-utils'
import { assertType, describe, expectTypeOf, it } from 'vitest'
import { useSuspenseQuery } from '../useSuspenseQuery'

describe('useSuspenseQuery', () => {
  it('should always have data defined', () => {
    const { data } = useSuspenseQuery({
      queryKey: createKey(),
      queryFn: () => Promise.resolve(5),
    })

    expectTypeOf(data).toEqualTypeOf<number>()
  })

  it('should not have pending status', () => {
    const { status } = useSuspenseQuery({
      queryKey: createKey(),
      queryFn: () => Promise.resolve(5),
    })

    expectTypeOf(status).toEqualTypeOf<'error' | 'success'>()
  })

  it('should allow undefined data when queryFn can be skipToken', () => {
    const skipped = useSuspenseQuery<number>({
      queryKey: createKey(),
      queryFn: skipToken,
    })
    expectTypeOf(skipped.data).toEqualTypeOf<number | undefined>()

    const result = useSuspenseQuery({
      queryKey: createKey(),
      queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
      select: (data) => data.toString(),
    })

    expectTypeOf(result.data).toEqualTypeOf<string | undefined>()
    if (result.isSuccess) {
      expectTypeOf(result.data).toEqualTypeOf<string>()
    }
    if (result.isPending) {
      expectTypeOf(result.data).toEqualTypeOf<undefined>()
    }
  })

  it('should allow placeholderData', () => {
    const query = useSuspenseQuery({
      queryKey: createKey(),
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
        queryKey: createKey(),
        queryFn: () => Promise.resolve(5),
        placeholderData: keepPreviousData,
      }),
    )

    const selected = useSuspenseQuery({
      queryKey: createKey(),
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
        queryKey: createKey(),
        queryFn: () => Promise.resolve(5),
        placeholderData: 5,
        // @ts-expect-error TS2345
        enabled: true,
      }),
    )
    assertType(
      useSuspenseQuery({
        queryKey: createKey(),
        queryFn: () => Promise.resolve(5),
        // @ts-expect-error TS2345
        enabled: true,
      }),
    )
    assertType(
      useSuspenseQuery({
        queryKey: createKey(),
        queryFn: () => Promise.resolve(5),
        // @ts-expect-error TS2345
        throwOnError: true,
      }),
    )
  })

  it('should return isPlaceholderData', () => {
    expectTypeOf(
      useSuspenseQuery({
        queryKey: createKey(),
        queryFn: () => Promise.resolve(5),
      }),
    ).toHaveProperty('isPlaceholderData')
  })

  it('should type-narrow the error field', () => {
    const query = useSuspenseQuery({
      queryKey: createKey(),
      queryFn: () => Promise.resolve(5),
    })

    if (query.status === 'error') {
      expectTypeOf(query.error).toEqualTypeOf<Error>()
    }
  })
})
