import { afterEach, describe, expect, test } from 'vitest'
import { environmentManager, isServer } from '..'

describe('environmentManager', () => {
  afterEach(() => {
    environmentManager.setIsServer(() => isServer)
  })

  test('should use the default isServer detection', () => {
    expect(environmentManager.isServer()).toBe(isServer)
  })

  test('should allow overriding isServer globally', () => {
    environmentManager.setIsServer(true)
    expect(environmentManager.isServer()).toBe(true)

    environmentManager.setIsServer(false)
    expect(environmentManager.isServer()).toBe(false)
  })

  test('should allow overriding isServer with a function', () => {
    environmentManager.setIsServer(() => true)
    expect(environmentManager.isServer()).toBe(true)
  })
})
