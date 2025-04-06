import { describe, expect, it } from 'vitest'
import { mutationOptions } from '../mutationOptions'
import type { UseMutationOptions } from '../types'

describe('mutationOptions', () => {
  it('should return the object received as a parameter without any modification.', () => {
    const object: UseMutationOptions = {
      mutationKey: ['key'],
      mutationFn: () => Promise.resolve(5),
    } as const

    expect(mutationOptions(object)).toStrictEqual(object)
  })
})
