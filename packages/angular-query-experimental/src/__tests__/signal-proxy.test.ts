import { isSignal, signal } from '@angular/core'
import { describe, expect, it } from 'vitest'
import { signalProxy } from '../signal-proxy'

describe('signalProxy', () => {
  const inputSignal = signal({ fn: () => 'bar', baz: 'qux' })
  const proxy = signalProxy(inputSignal)

  it('should have computed fields', () => {
    expect(proxy.baz()).toBe('qux')
    expect(isSignal(proxy.baz)).toBe(true)
  })

  it('should pass through functions as-is', () => {
    expect(proxy.fn()).toBe('bar')
    expect(isSignal(proxy.fn)).toBe(false)
  })

  it('should support "in" operator', () => {
    expect('baz' in proxy).toBe(true)
    expect('foo' in proxy).toBe(false)
  })

  it('should support "Object.keys"', () => {
    expect(Object.keys(proxy)).toStrictEqual(['fn', 'baz'])
  })
})
