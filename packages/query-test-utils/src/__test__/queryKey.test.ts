import { queryKey } from 'src/queryKey'
import { describe, expect, it } from 'vitest'

describe('queryKey', () => {
  it('should return a query key', () => {
    const key = queryKey()
    expect(key).toEqual(['query_1'])
  })
  it('should return a new query key each time', () => {
    expect(queryKey()).not.toEqual(queryKey())
  })
})
