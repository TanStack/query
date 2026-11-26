import { describe, expect, it } from 'vitest'
import { QueryClient } from '../queryClient'
import { queryOptions } from '../queryOptions'

describe('queryOptions', () => {
  it('should return the options unchanged and work with the query client', async () => {
    const options = {
      queryKey: ['core-options'],
      queryFn: () => Promise.resolve(42),
    }
    expect(queryOptions(options)).toBe(options)
    const client = new QueryClient()
    await expect(client.query(queryOptions(options))).resolves.toBe(42)
    expect(client.getQueryData(options.queryKey)).toBe(42)
    client.clear()
  })
})
