import { QueryClient } from '@tanstack/query-core'
import { LitElement } from 'lit'
import { describe, expectTypeOf, it } from 'vitest'
import { createMutationController } from '../createMutationController.js'
import { mutationOptions } from '../mutationOptions.js'

class Host extends LitElement {}

describe('mutationOptions', () => {
  it('should infer types when used with createMutationController', () => {
    const mutation = createMutationController(
      new Host(),
      mutationOptions({
        mutationFn: (input: { id: number }) =>
          Promise.resolve(input.id.toString()),
      }),
      new QueryClient(),
    )

    expectTypeOf(mutation().data).toEqualTypeOf<string | undefined>()
    expectTypeOf(mutation().variables).toEqualTypeOf<
      { id: number } | undefined
    >()
  })
})
