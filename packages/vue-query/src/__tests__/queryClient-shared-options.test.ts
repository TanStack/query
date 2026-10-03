import { describe, expect, it } from 'vitest'
import { computed, ref } from 'vue-demi'
import { QueryClient, skipToken } from '..'
import type { UseQueryOptions } from '..'

describe('QueryClient shared UseQueryOptions at runtime', () => {
  it('unwraps Vue options while keeping query() select separate from the fetch wrappers', async () => {
    const id = ref('first')
    const options: UseQueryOptions<number, Error, string> = {
      queryKey: () => ['shared', id.value],
      queryFn: computed(() => () => Promise.resolve(2)),
      select: (value) => String(value),
    }
    const client = new QueryClient()

    await expect(client.query(options)).resolves.toBe('2')
    id.value = 'second'
    // eslint-disable-next-line no-restricted-syntax -- regression coverage for the deprecated API
    await expect(client.ensureQueryData(options)).resolves.toBe(2)
    // eslint-disable-next-line no-restricted-syntax -- regression coverage for the deprecated API
    await expect(client.fetchQuery(options)).resolves.toBe(2)
    // eslint-disable-next-line no-restricted-syntax -- regression coverage for the deprecated API
    await expect(client.prefetchQuery(options)).resolves.toBeUndefined()
    expect(client.getQueryData(['shared', 'first'])).toBe(2)
    expect(client.getQueryData(['shared', 'second'])).toBe(2)
  })

  it('returns cached data when its type differs from the queryFn result', async () => {
    const client = new QueryClient()
    let fetchCount = 0
    const options: UseQueryOptions<number, Error, boolean, string> = {
      queryKey: ['different-cache-data'],
      queryFn: () => {
        fetchCount += 1
        return Promise.resolve(2)
      },
      select: (value) => value.length > 0,
      staleTime: Infinity,
    }
    client.setQueryData(['different-cache-data'], 'cached')

    await expect(client.query(options)).resolves.toBe(true)
    // eslint-disable-next-line no-restricted-syntax -- regression coverage for the deprecated API
    await expect(client.ensureQueryData(options)).resolves.toBe('cached')
    // eslint-disable-next-line no-restricted-syntax -- regression coverage for the deprecated API
    await expect(client.fetchQuery(options)).resolves.toBe('cached')
    // eslint-disable-next-line no-restricted-syntax -- regression coverage for the deprecated API
    await expect(client.prefetchQuery(options)).resolves.toBeUndefined()
    expect(fetchCount).toBe(0)
  })

  it('keeps the existing skipToken and invalid-symbol rejection behavior', async () => {
    const client = new QueryClient()
    const skipped: UseQueryOptions<number> = {
      queryKey: ['skip'],
      queryFn: skipToken,
    }
    const invalid: UseQueryOptions<number> = {
      queryKey: ['invalid'],
      queryFn: Symbol('other'),
    }

    await expect(client.query(skipped)).rejects.toThrow(/Missing queryFn/)
    await expect(client.query(invalid)).rejects.toThrow(TypeError)
  })
})
