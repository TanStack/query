import { describe, expect, it, vi } from 'vitest'

describe('VueQueryDevtoolsPanel', () => {
  it('should return null in non-development environments', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.resetModules()

    try {
      const { VueQueryDevtoolsPanel } = await import('..')
      expect((VueQueryDevtoolsPanel as unknown as () => null)()).toBeNull()
    } finally {
      vi.unstubAllEnvs()
      vi.resetModules()
    }
  })
})
