import { describe, expect, it } from 'vitest'
import { query, queryOptions, skipToken, suspenseQuery } from '..'

describe('query render modes', () => {
  it('keeps ordinary query options by reference and scopes Suspense to the consumer', () => {
    const options = queryOptions({ queryKey: ['post'], queryFn: () => 'Dune' })
    expect(query(options)).toBe(options)
    expect(suspenseQuery(options).renderPolicy).toBeDefined()
    expect(
      suspenseQuery({ ...options, queryFn: skipToken }).renderPolicy,
    ).toBeUndefined()
    expect(options).not.toHaveProperty('renderPolicy')
  })
})
