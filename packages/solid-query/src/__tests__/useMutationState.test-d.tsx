import { describe, expectTypeOf, it } from 'vitest'
import { useMutationState } from '../useMutationState'
import type { Mutation, MutationState, MutationStatus } from '@tanstack/query-core'

describe('useMutationState', () => {
  it('should default to QueryState', () => {
    const result = useMutationState(() => ({
      filters: { status: 'pending' },
    }))

    expectTypeOf(result()).toEqualTypeOf<Array<MutationState>>()
  })
  it('should infer with select', () => {
    const result = useMutationState(() => ({
      filters: { status: 'pending' },
      select: (mutation) => mutation.state.status,
    }))

    expectTypeOf(result()).toEqualTypeOf<Array<MutationStatus>>()
  })
  it('should propagate generics to select callback when TResult is typed MutationState', () => {
    type MyData = { data: Array<string> }
    type MyError = { code: number; message: string }
    type MyVars = { id: number }

    const result = useMutationState<MutationState<MyData, MyError, MyVars>>(
      () => ({
        filters: { mutationKey: ['key'] },
        select: (mutation) => {
          expectTypeOf(mutation).toEqualTypeOf<
            Mutation<MyData, MyError, MyVars, unknown>
          >()
          return mutation.state
        },
      }),
    )

    expectTypeOf(result()).toEqualTypeOf<
      Array<MutationState<MyData, MyError, MyVars, unknown>>
    >()
  })
})
