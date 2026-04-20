import { isSignal, signal } from '@angular/core'
import { describe, expect, it } from 'vitest'
import { signalProxy } from '../signal-proxy'

describe('signalProxy', () => {
  const inputSignal = signal({ fn: () => 'bar', baz: 'qux' })
  const proxy = signalProxy(inputSignal)

  it('should have computed fields', () => {
    expect(proxy.baz()).toEqual('qux')
    expect(isSignal(proxy.baz)).toBe(true)
  })

  it('should pass through functions as-is', () => {
    expect(proxy.fn()).toEqual('bar')
    expect(isSignal(proxy.fn)).toBe(false)
  })

  it('supports "in" operator', () => {
    expect('baz' in proxy).toBe(true)
    expect('foo' in proxy).toBe(false)
  })

  it('supports "Object.keys"', () => {
    expect(Object.keys(proxy)).toEqual(['fn', 'baz'])
  })
})
