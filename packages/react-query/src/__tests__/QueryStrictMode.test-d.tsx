import { assertType, describe, expectTypeOf, it } from 'vitest'
import {
  QueryStrictMode,
  QueryStrictModeError,
  QueryStrictModeMissingPrefetchError,
  QueryStrictModeUnusedPrefetchError,
} from '..'
import type {
  QueryStrictModeEvent,
  QueryStrictModeMissingPrefetchEvent,
  QueryStrictModeUnusedPrefetchEvent,
} from '..'

describe('QueryStrictMode', () => {
  it('should pass each handler its own event', () => {
    assertType(
      <QueryStrictMode
        handleMissingPrefetch={(event) => {
          expectTypeOf(
            event,
          ).toEqualTypeOf<QueryStrictModeMissingPrefetchEvent>()
          expectTypeOf(event.suspense).toEqualTypeOf<boolean>()
          throw new QueryStrictModeMissingPrefetchError(event)
        }}
        handleUnusedPrefetch={(event) => {
          expectTypeOf(
            event,
          ).toEqualTypeOf<QueryStrictModeUnusedPrefetchEvent>()
          throw new QueryStrictModeUnusedPrefetchError(event)
        }}
      />,
    )
  })

  it('should narrow a QueryStrictModeEvent by its type', () => {
    const narrow = (event: QueryStrictModeEvent) => {
      if (event.type === 'missing-prefetch') {
        expectTypeOf(event).toEqualTypeOf<QueryStrictModeMissingPrefetchEvent>()
      } else {
        expectTypeOf(event).toEqualTypeOf<QueryStrictModeUnusedPrefetchEvent>()
      }
    }
    assertType(narrow)
  })

  it('should narrow the event of each error', () => {
    const narrow = (error: unknown) => {
      if (error instanceof QueryStrictModeMissingPrefetchError) {
        expectTypeOf(
          error.event,
        ).toEqualTypeOf<QueryStrictModeMissingPrefetchEvent>()
      } else if (error instanceof QueryStrictModeUnusedPrefetchError) {
        expectTypeOf(
          error.event,
        ).toEqualTypeOf<QueryStrictModeUnusedPrefetchEvent>()
      } else if (error instanceof QueryStrictModeError) {
        expectTypeOf(error.event).toEqualTypeOf<QueryStrictModeEvent>()
      }
    }
    assertType(narrow)
  })

  it('should not construct a QueryStrictModeError directly', () => {
    const create = (event: QueryStrictModeEvent) =>
      // @ts-expect-error The constructor is protected
      new QueryStrictModeError(event)
    assertType(create)
  })

  it('should not create an error for the other problem', () => {
    const create = (event: QueryStrictModeUnusedPrefetchEvent) =>
      // @ts-expect-error A missing prefetch error needs a missing prefetch event
      new QueryStrictModeMissingPrefetchError(event)
    assertType(create)
  })
})
