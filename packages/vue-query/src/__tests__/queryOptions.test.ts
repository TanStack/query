import { describe, expect, it } from 'vitest'
import { queryOptions } from '../queryOptions'

describe('queryOptions', () => {
  it('should return object strict same with input object', () => {
    const options = {
      queryKey: ['queryKey'],
      queryFn: async () => {
        return 'return'
      },
    }
    expect(queryOptions(options)).toStrictEqual(options)
  })
})
