import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  inputBinding,
  isSignal,
  provideZonelessChangeDetection,
  signal,
  untracked,
} from '@angular/core'
import { render } from '@testing-library/angular'
import { beforeEach, describe, expect, test } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { signalProxy } from '../signal-proxy'

describe('signalProxy', () => {
  const inputSignal = signal({
    fn: () => 'bar',
    baz: 'qux',
    falsy: false,
    zero: 0,
  })
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
    expect('falsy' in proxy).toBe(true)
    expect('zero' in proxy).toBe(true)
    expect('foo' in proxy).toBe(false)
  })

  test('supports "Object.keys"', () => {
    expect(Object.keys(proxy)).toEqual(['fn', 'baz', 'falsy', 'zero'])
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

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      })
    })

    test('should generate fixed fields after initial change detection run', async () => {
      const number = signal(1)
      const rendered = await render(TestComponent, {
        bindings: [inputBinding('number', number.asReadonly())],
      })
      const instance = rendered.fixture.componentInstance

      expect(isSignal(instance.proxy.number)).toBe(true)
      expect(instance.proxy.number()).toBe(1)
      expect(instance.shortNumber).toBe(instance.proxy.number)

      expect(instance.proxy.fn()).toBe(2)
      expect(isSignal(instance.proxy.fn)).toBe(false)
      expect(instance.shortFn).toBe(instance.proxy.fn)
    })

    test('should reflect updates on the proxy', async () => {
      const number = signal(0)
      const rendered = await render(TestComponent, {
        bindings: [inputBinding('number', number.asReadonly())],
      })
      const instance = rendered.fixture.componentInstance

      expect(instance.shortNumber()).toBe(0)
      expect(instance.shortFn()).toBe(1)

      number.set(1)
      rendered.fixture.detectChanges()

      expect(instance.shortNumber()).toBe(1)
      expect(instance.shortFn()).toBe(2)
    })
  })
})
