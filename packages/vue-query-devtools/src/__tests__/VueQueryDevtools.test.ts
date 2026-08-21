import { describe, expect, it, vi } from 'vitest'

describe('VueQueryDevtools', () => {
  it('should return null in non-development environments', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.resetModules()

    try {
      const { VueQueryDevtools } = await import('..')
      expect((VueQueryDevtools as unknown as () => null)()).toBeNull()
    } finally {
      vi.unstubAllEnvs()
      vi.resetModules()
    }
  })
})
