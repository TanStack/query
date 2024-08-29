import { describe, expect, test } from 'vitest'
import { Component, effect, input, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { lazySignalInitializer } from '../../../util/lazy-signal-initializer/lazy-signal-initializer'
import { flushQueue, setFixtureSignalInputs } from '../../test-utils'
import type { Signal, WritableSignal } from '@angular/core'

describe('lazySignalInitializer', () => {
  test('should init lazily in next tick when not accessing manually', async () => {
    const mockFn = vi.fn()

    TestBed.runInInjectionContext(() => {
      lazySignalInitializer(() => {
        mockFn()
        return signal(true)
      })
    })

    expect(mockFn).not.toHaveBeenCalled()

    await new Promise(setImmediate)

    expect(mockFn).toHaveBeenCalled()
  })

  test('should init eagerly accessing manually', async () => {
    const mockFn = vi.fn()

    TestBed.runInInjectionContext(() => {
      const lazySignal = lazySignalInitializer(() => {
        mockFn()
        return signal(true)
      })

      lazySignal()
    })

    expect(mockFn).toHaveBeenCalled()
  })

  test('should init lazily and only once', async () => {
    const initCallFn = vi.fn()
    const registerEffectValue = vi.fn<(arg: number) => any>()

    let value!: Signal<number>
    const outerSignal = signal(0)
    let innerSignal!: WritableSignal<number>

    TestBed.runInInjectionContext(() => {
      value = lazySignalInitializer(() => {
        initCallFn()
        innerSignal = signal(0)

        void outerSignal()

        return innerSignal
      })

      effect(() => registerEffectValue(value()))
    })

    value()

    await flushQueue()

    expect(outerSignal).toBeDefined()
    expect(innerSignal).toBeDefined()

    expect(initCallFn).toHaveBeenCalledTimes(1)

    innerSignal.set(1)
    await flushQueue()
    outerSignal.set(2)
    await flushQueue()

    expect(initCallFn).toHaveBeenCalledTimes(1)
    expect(registerEffectValue).toHaveBeenCalledTimes(2)
  })

  test('should init lazily', async () => {
    @Component({
      standalone: true,
      template: `{{ subscribed }}`,
    })
    class Test {
      subscribed = false

      lazySignal = lazySignalInitializer(() => {
        this.subscribed = true
        return signal('value')
      })
    }

    const fixture = TestBed.createComponent(Test)
    const { debugElement } = fixture
    fixture.detectChanges()

    expect(debugElement.nativeElement.textContent).toBe('false')

    await new Promise(setImmediate)

    fixture.detectChanges()

    expect(debugElement.nativeElement.textContent).toBe('true')
  })

  test('should support required signal input', () => {
    @Component({
      standalone: true,
      template: `{{ subscribed }}`,
    })
    class Test {
      readonly title = input.required<string>()
      subscribed = false

      lazySignal = lazySignalInitializer(() => {
        return signal(this.title())
      })
    }

    const fixture = TestBed.createComponent(Test)
    setFixtureSignalInputs(fixture, { title: 'newValue' })
  })
})
