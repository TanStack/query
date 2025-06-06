import { describe, expect, it } from 'vitest'
import { mutationOptions } from '../mutationOptions'

describe('mutationOptions', () => {
  it('should return the object received as a parameter without any modification.', () => {
    const object = {
      mutationKey: ['key'],
      mutationFn: () => Promise.resolve(5),
    } as const

    expect(mutationOptions(object)).toStrictEqual(object)
  })
})
