import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  inputBinding,
  isSignal,
  signal,
} from '@angular/core'
import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { signalProxy } from '../utils/signal-proxy'
import { provideAngularQueryChangeDetection } from './test-utils'

describe('signalProxy', () => {
  it('only exposes declared fields with ordinary object semantics', async () => {
    const source = signal({ value: 'data', falsy: false, zero: 0 })
    const proxy = signalProxy(source, ['value', 'falsy', 'zero'])

    expect(Object.keys(proxy)).toEqual(['value', 'falsy', 'zero'])
    expect('value' in proxy).toBe(true)
    expect('falsy' in proxy).toBe(true)
    expect('zero' in proxy).toBe(true)
    expect('missing' in proxy).toBe(false)
    expect(Object.hasOwn(proxy, 'missing')).toBe(false)
    expect(Reflect.get(proxy, 'then')).toBeUndefined()
    expect(await Promise.resolve(proxy)).toBe(proxy)
  })

  it('should have computed fields', () => {
    const source = signal({ value: 'data' })
    const proxy = signalProxy(source, ['value'])
    expect(proxy.value()).toBe('data')
    expect(isSignal(proxy.value)).toBe(true)
  })

  describe('in component fixture', () => {
    @Component({
      selector: 'app-test',
      standalone: true,
      template: '{{ proxy.number() }}',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class TestComponent {
      number = input.required<number>()
      obj = computed(() => ({ number: this.number() }))
      proxy = signalProxy(this.obj, ['number'])
      shortNumber = this.proxy.number
    }

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [provideAngularQueryChangeDetection()],
      })
    })

    it('should retain field signals and update aliases of required inputs', () => {
      const number = signal(0)
      const fixture = TestBed.createComponent(TestComponent, {
        bindings: [inputBinding('number', number.asReadonly())],
      })
      fixture.detectChanges()
      const instance = fixture.componentInstance

      expect(isSignal(instance.proxy.number)).toBe(true)
      expect(instance.shortNumber).toBe(instance.proxy.number)
      expect(instance.shortNumber()).toBe(0)

      number.set(1)
      fixture.detectChanges()

      expect(instance.shortNumber).toBe(instance.proxy.number)
      expect(instance.shortNumber()).toBe(1)
      expect(fixture.nativeElement.textContent).toBe('1')
    })
  })
})
