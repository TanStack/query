import { QueryClient } from '@tanstack/query-core'
import { describe, expectTypeOf, it } from 'vitest'
import { useMutationState } from '../useMutationState.js'
import { TestControllerHost } from './testHost.js'
import type { Mutation, MutationState } from '@tanstack/query-core'

describe('useMutationState types', () => {
  it('propagates typed mutation state generics to the select callback', () => {
    type MyData = { data: Array<string> }
    type MyError = { code: number; message: string }
    type MyVariables = { id: number }

    useMutationState<MutationState<MyData, MyError, MyVariables>>(
      new TestControllerHost(),
      {
        filters: { mutationKey: ['key'] },
        select: (mutation) => {
          expectTypeOf(mutation).toEqualTypeOf<
            Mutation<MyData, MyError, MyVariables, unknown>
          >()
          return mutation.state
        },
      },
      new QueryClient(),
    )
  })
})
