import type { Mutation, MutationState, MutationStatus } from '@tanstack/query-core'
import { describe, expectTypeOf, it } from 'vitest'

import { useMutationState } from '../useMutationState'

describe('useMutationState', () => {
  it('should default to QueryState', () => {
    const result = useMutationState({
      filters: { status: 'pending' },
    })

    expectTypeOf(result).toEqualTypeOf<
      Array<MutationState<unknown, Error, unknown, unknown>>
    >()
  })
  it('should infer with select', () => {
    const result = useMutationState({
      filters: { status: 'pending' },
      select: (mutation) => mutation.state.status,
    })

    expectTypeOf(result).toEqualTypeOf<Array<MutationStatus>>()
  })
  it('should propagate generics to select callback when TResult is typed MutationState', () => {
    type MyData = { data: Array<string> }
    type MyError = { code: number; message: string }
    type MyVars = { id: number }

    useMutationState<MutationState<MyData, MyError, MyVars>>({
      filters: { mutationKey: ['key'] },
      select: (mutation) => {
        expectTypeOf(mutation).toEqualTypeOf<
          Mutation<MyData, MyError, MyVars, unknown>
        >()
        return mutation.state
      },
    })
  })
})
