import { assertType, describe, expectTypeOf, it } from 'vitest'
import { useMutation } from 'src/useMutation'
import { mutationOptions } from '../mutationOptions'
import type { UseMutationOptions, UseMutationResult } from 'src/types'
import type { DefaultError } from '@tanstack/query-core'

describe('mutationOptions', () => {
  it('should not allow excess properties', () => {
    mutationOptions({
      mutationFn: () => Promise.resolve(5),
      mutationKey: ['key'],
      // @ts-expect-error this is a good error, because onMutates does not exist!
      onMutates: 1000,
      onSuccess: (data) => {
        expectTypeOf(data).toEqualTypeOf<number>()
      },
    })
  })

  it('should not allow usage without mutationKey', () => {
    // @ts-expect-error this is a good error, because mutationKey is required
    mutationOptions({
      mutationFn: () => Promise.resolve(5),
      onSuccess: (data) => {
        expectTypeOf(data).toEqualTypeOf<number>()
      },
    })
  })

  it('should infer types for callbacks', () => {
    mutationOptions({
      mutationFn: () => Promise.resolve(5),
      mutationKey: ['key'],
      onSuccess: (data) => {
        expectTypeOf(data).toEqualTypeOf<number>()
      },
    })
  })

  it('should infer types for onError callback', () => {
    mutationOptions({
      mutationFn: () => {
        throw new Error('fail')
      },
      mutationKey: ['key'],
      onError: (error) => {
        expectTypeOf(error).toEqualTypeOf<DefaultError>()
      },
    })
  })

  it('should infer types for variables', () => {
    mutationOptions<number, DefaultError, { id: string }>({
      mutationFn: (vars) => {
        expectTypeOf(vars).toEqualTypeOf<{ id: string }>()
        return Promise.resolve(5)
      },
      mutationKey: ['with-vars'],
    })
  })

  it('should infer context type correctly', () => {
    mutationOptions<number, DefaultError, void, { name: string }>({
      mutationFn: () => Promise.resolve(5),
      mutationKey: ['key'],
      onMutate: () => {
        return { name: 'context' }
      },
      onSuccess: (_data, _variables, context) => {
        expectTypeOf(context).toEqualTypeOf<{ name: string }>()
      },
    })
  })

  it('should error if mutationFn return type mismatches TData', () => {
    assertType(
      mutationOptions<number>({
        // @ts-expect-error this is a good error, because return type is string, not number
        mutationFn: async () => Promise.resolve('wrong return'),
      }),
    )
  })

  it('should allow mutationKey to be omitted', () => {
    return mutationOptions({
      mutationFn: () => Promise.resolve(123),
      mutationKey: ['key'],
      onSuccess: (data) => {
        expectTypeOf(data).toEqualTypeOf<number>()
      },
    })
  })

  it('should infer all types when not explicitly provided', () => {
    const mutation = mutationOptions({
      mutationFn: (id: string) => Promise.resolve(id.length),
      mutationKey: ['key'],
      onSuccess: (data) => {
        expectTypeOf(data).toEqualTypeOf<number>()
      },
    })

    expectTypeOf(mutation).toMatchTypeOf<
      UseMutationOptions<number, DefaultError, string>
    >()
  })

  it('should infer types when used with useMutation', () => {
    const mutation = useMutation({
      ...mutationOptions({
        mutationKey: ['key'],
        mutationFn: () => Promise.resolve({ field: 'test' }),
      }),
      onSuccess: (data) =>
        expectTypeOf(data).toEqualTypeOf<{ field: string }>(),
    })
    expectTypeOf(mutation).toMatchTypeOf<
      UseMutationResult<{ field: string }, DefaultError, void, unknown>
    >()
  })
})
