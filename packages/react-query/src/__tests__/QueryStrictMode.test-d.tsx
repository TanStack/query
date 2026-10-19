import { assertType, describe, expectTypeOf, it } from 'vitest'
import { QueryStrictMode, QueryStrictModeError } from '..'
import type { QueryStrictModeEvent } from '..'

describe('QueryStrictMode', () => {
  it('should accept a handler that receives a QueryStrictModeEvent', () => {
    assertType(
      <QueryStrictMode
        handler={(event) => {
          expectTypeOf(event).toEqualTypeOf<QueryStrictModeEvent>()
          if (event.type === 'unused-prefetch') {
            throw new QueryStrictModeError(event)
          }
        }}
      />,
    )
  })
})
