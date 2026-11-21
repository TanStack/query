import { afterEach, describe, expect, it } from 'vitest'
import { environmentManager } from '..'

const defaultIsServer = environmentManager.isServer()

describe('environmentManager', () => {
  afterEach(() => {
    environmentManager.setIsServer(() => defaultIsServer)
  })

  it('should use the default isServer detection', () => {
    expect(environmentManager.isServer()).toBe(
      typeof window === 'undefined' || 'Deno' in globalThis,
    )
  })

  it('should allow overriding isServer globally', () => {
    environmentManager.setIsServer(() => true)
    expect(environmentManager.isServer()).toBe(true)

    environmentManager.setIsServer(() => false)
    expect(environmentManager.isServer()).toBe(false)
  })

  it('should allow overriding isServer with a function', () => {
    let server = true
    environmentManager.setIsServer(() => server)
    expect(environmentManager.isServer()).toBe(true)

    server = false
    expect(environmentManager.isServer()).toBe(false)
  })
})
