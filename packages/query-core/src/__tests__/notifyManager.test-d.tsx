import { assertType, describe, expectTypeOf, it } from 'vitest'
import { createNotifyManager } from '../notifyManager'

describe('notifyManager', () => {
  it('typeDefs should catch proper signatures', () => {
    const notifyManagerTest = createNotifyManager()

    // we define some fn with its signature:
    const fn: (a: string, b: number) => string = (a, b) => a + b

    // now someFn expect to be called with args [a: string, b: number]
    const someFn = notifyManagerTest.batchCalls(fn)

    expectTypeOf(someFn).parameters.toEqualTypeOf<Parameters<typeof fn>>()
    assertType<Parameters<typeof someFn>>(['im happy', 4])
    assertType<Parameters<typeof someFn>>([
      'im not happy',
      // @ts-expect-error
      false,
    ])
  })
})
