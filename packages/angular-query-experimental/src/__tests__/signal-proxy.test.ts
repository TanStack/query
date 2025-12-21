import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  isSignal,
  provideZonelessChangeDetection,
  signal,
  untracked,
} from '@angular/core'
import { beforeEach, describe, expect, test } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { signalProxy } from '../signal-proxy'
import { registerSignalInput } from './test-utils'

describe('signalProxy', () => {
  const inputSignal = signal({ fn: () => 'bar', baz: 'qux' })
  const proxy = signalProxy(inputSignal, ['fn'])

  test('should have computed fields', () => {
    expect(proxy.baz()).toEqual('qux')
    expect(isSignal(proxy.baz)).toBe(true)
  })

  test('should pass through functions as-is', () => {
    expect(proxy.fn()).toEqual('bar')
    expect(isSignal(proxy.fn)).toBe(false)
  })

  test('supports "in" operator', () => {
    expect('baz' in proxy).toBe(true)
    expect('foo' in proxy).toBe(false)
  })

  test('supports "Object.keys"', () => {
    expect(Object.keys(proxy)).toEqual(['fn', 'baz'])
  })

  describe('in component fixture', () => {
    @Component({
      selector: 'app-test',
      template: '{{ proxy.baz() }}',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class TestComponent {
      number = input.required<number>()
      obj = computed(() => ({
        number: this.number(),
        fn: () => untracked(this.number) + 1,
      }))
      proxy = signalProxy(this.obj, ['fn'])
      shortNumber = this.proxy.number
      shortFn = this.proxy.fn
    }
    registerSignalInput(TestComponent, 'number')

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      })
    })

    test('should generate fixed fields after initial change detection run', () => {
      const fixture = TestBed.createComponent(TestComponent)
      const instance = fixture.componentInstance

      expect(() => instance.shortNumber).not.throw()
      expect(() => instance.shortNumber()).toThrow()

      fixture.componentRef.setInput('number', 1)
      fixture.detectChanges()

      expect(isSignal(instance.proxy.number)).toBe(true)
      expect(instance.proxy.number()).toBe(1)
      expect(instance.shortNumber).toBe(instance.proxy.number)

      expect(instance.proxy.fn()).toBe(2)
      expect(isSignal(instance.proxy.fn)).toBe(false)
      expect(instance.shortFn).toBe(instance.proxy.fn)
    })

    test('should reflect updates on the proxy', () => {
      const fixture = TestBed.createComponent(TestComponent)
      const instance = fixture.componentInstance
      fixture.componentRef.setInput('number', 0)
      fixture.detectChanges()

      expect(instance.shortNumber()).toBe(0)
      expect(instance.shortFn()).toBe(1)

      fixture.componentRef.setInput('number', 1)

      expect(instance.shortNumber()).toBe(1)
      expect(instance.shortFn()).toBe(2)
    })
  })
})
