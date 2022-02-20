import { logger } from '../logger.native'

describe('logger native', () => {
  it('should expose logger properties', () => {
    expect(logger).toHaveProperty('log')
    expect(logger).toHaveProperty('error')
    expect(logger).toHaveProperty('warn')
  })
})
