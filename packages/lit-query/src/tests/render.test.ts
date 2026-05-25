import { expectTypeOf, it, describe, expect } from 'vitest'
import { renderResult } from '../render.js'

type ExampleResult =
  | {
      status: 'pending'
    }
  | {
      status: 'success'
      data: string
    }
  | {
      status: 'error'
      error: Error
    }

describe('renderResult', () => {
  it('should infer types correctly, and return the correct value', () => {
    const result = { status: 'pending' } as ExampleResult
    const output = renderResult(result, {
      pending(result) {
        expectTypeOf(result).toEqualTypeOf<{ status: 'pending' }>()
        return 0 as const
      },
      success(result) {
        expectTypeOf(result).toEqualTypeOf<{
          status: 'success'
          data: string
        }>()
        return 1 as const
      },
      error(result) {
        expectTypeOf(result).toEqualTypeOf<{ status: 'error'; error: Error }>()
        return 2 as const
      },
    })
    expectTypeOf(output).toEqualTypeOf<0 | 1 | 2>()
    expect(output).toBe(0)
  })
  it('should return undefined if no renderer matches', () => {
    const result = { status: 'pending' } as ExampleResult
    const output = renderResult(result, {
      success() {
        return 1 as const
      },
      error() {
        return 2 as const
      },
    })
    expectTypeOf(output).toEqualTypeOf<1 | 2 | undefined>()
    expect(output).toBeUndefined()
  })
})
