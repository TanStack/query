import { assertType, describe, expectTypeOf, it } from 'vitest'
import { QueryStrictMode, QueryStrictModeError } from '..'
import type {
  QueryStrictModeEvent,
  QueryStrictModeHandler,
  QueryStrictModeProps,
} from '..'

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

    expectTypeOf<QueryStrictModeHandler>().toEqualTypeOf<
      (event: QueryStrictModeEvent) => void
    >()
    expectTypeOf<QueryStrictModeProps['handler']>().toEqualTypeOf<
      QueryStrictModeHandler | undefined
    >()
  })

  it('should not accept logger, throwOnMissingPrefetch or throwOnUnusedPrefetch', () => {
    assertType(
      <QueryStrictMode
        // @ts-expect-error logger was replaced by handler
        logger={() => undefined}
      />,
    )

    assertType(
      <QueryStrictMode
        // @ts-expect-error throwOnMissingPrefetch was replaced by handler
        throwOnMissingPrefetch
      />,
    )

    assertType(
      <QueryStrictMode
        // @ts-expect-error throwOnUnusedPrefetch was replaced by handler
        throwOnUnusedPrefetch
      />,
    )
  })
})
