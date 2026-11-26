import { describe, expect, it } from 'vitest'
import { MutationObserver } from '../mutationObserver'
import { mutationOptions } from '../mutationOptions'
import { QueryClient } from '../queryClient'

describe('mutationOptions', () => {
  it('should return the options unchanged and work with a mutation observer', async () => {
    const options = {
      mutationFn: (variables: { id: string }) => Promise.resolve(variables.id),
    }
    expect(mutationOptions(options)).toBe(options)
    const client = new QueryClient()
    const observer = new MutationObserver(client, mutationOptions(options))
    await expect(observer.mutate({ id: '1' })).resolves.toBe('1')
    client.clear()
  })
})
