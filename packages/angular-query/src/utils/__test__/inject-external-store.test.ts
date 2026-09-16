import { Component, computed, input, inputBinding, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { injectExternalStore } from '../inject-external-store'
import { provideAngularQueryChangeDetection } from '../../__tests__/test-utils'
import type { Signal } from '@angular/core'

function store(initial: number) {
  let current = initial
  const listeners = new Set<() => void>()
  const cleanup = vi.fn((notify: () => void) => listeners.delete(notify))
  const subscribe = vi.fn((notify: () => void) => {
    listeners.add(notify)
    return () => cleanup(notify)
  })
  return {
    subscribe,
    cleanup,
    getSnapshot: () => current,
    set(next: number) {
      current = next
      listeners.forEach((notify) => notify())
    },
  }
}

function host<T>(
  create: () => Signal<T>,
  initialize?: (value: Signal<T>) => void,
) {
  @Component({ template: '' })
  class Host {
    readonly value = create()
    ngOnInit() {
      initialize?.(this.value)
    }
  }
  return TestBed.createComponent(Host)
}

describe('injectExternalStore', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideAngularQueryChangeDetection()],
    })
  })

  it('reflects changes made during initialization after an early snapshot read', () => {
    const source = store(1)
    const fixture = host(
      () => injectExternalStore(() => source),
      (value) => {
        expect(value()).toBe(1)
        source.set(2)
      },
    )
    fixture.detectChanges()
    expect(fixture.componentInstance.value()).toBe(2)
    source.set(3)
    expect(fixture.componentInstance.value()).toBe(3)
  })

  it.each([false, true])(
    'reflects changes made by subscription setup (notifies: %s)',
    (notifies) => {
      const source = store(1)
      const fixture = host(() =>
        injectExternalStore(() => ({
          getSnapshot: source.getSnapshot,
          subscribe: (notify) => {
            source.set(2)
            if (notifies) notify()
            return source.subscribe(notify)
          },
        })),
      )
      fixture.detectChanges()
      expect(fixture.componentInstance.value()).toBe(2)
      source.set(3)
      expect(fixture.componentInstance.value()).toBe(3)
    },
  )

  it('preserves equal snapshots for consumers', () => {
    const source = store(1)
    const fixture = host(() =>
      injectExternalStore(
        () => ({
          getSnapshot: () => ({ count: source.getSnapshot() }),
          subscribe: source.subscribe,
        }),
        { equal: (a, b) => a.count === b.count },
      ),
    )
    fixture.detectChanges()
    const derive = vi.fn(() => fixture.componentInstance.value().count)
    const derived = computed(derive)
    expect(derived()).toBe(1)
    source.set(1)
    expect(derived()).toBe(1)
    expect(derive).toHaveBeenCalledOnce()
    source.set(2)
    expect(derived()).toBe(2)
  })

  it('tracks snapshot dependencies without reconnecting for selectors or incidental reads', () => {
    const source = store(0)
    const multiplier = signal(10)
    const incidental = signal(0)
    const fixture = host(() =>
      injectExternalStore(() => ({
        getSnapshot: () => (source.getSnapshot() > 0 ? multiplier() : 0),
        subscribe: (notify) => {
          incidental()
          return source.subscribe(notify)
        },
      })),
    )
    fixture.detectChanges()
    const value = fixture.componentInstance.value
    expect(value()).toBe(0)
    source.set(1)
    expect(value()).toBe(10)
    multiplier.set(20)
    incidental.set(1)
    fixture.detectChanges()
    expect(value()).toBe(20)
    expect(source.subscribe).toHaveBeenCalledOnce()
  })

  it('follows the current source and releases the previous source', () => {
    const first = store(1)
    const second = store(10)
    const requested = signal(first)
    const fixture = host(() => injectExternalStore(() => requested()))
    fixture.detectChanges()
    const value = fixture.componentInstance.value
    expect(value()).toBe(1)
    requested.set(second)
    expect(value()).toBe(10)
    second.set(11)
    fixture.detectChanges()
    expect(value()).toBe(11)
    expect(first.cleanup).toHaveBeenCalledOnce()
    first.set(2)
    expect(value()).toBe(11)
    second.set(12)
    expect(value()).toBe(12)
  })

  it('releases observation while paused and catches up on resume', () => {
    const source = store(1)
    const paused = signal(false)
    const fixture = host(() =>
      injectExternalStore(() => ({
        getSnapshot: source.getSnapshot,
        subscribe: paused() ? undefined : source.subscribe,
      })),
    )
    fixture.detectChanges()
    paused.set(true)
    fixture.detectChanges()
    expect(source.cleanup).toHaveBeenCalledOnce()
    source.set(2)
    paused.set(false)
    fixture.detectChanges()
    expect(fixture.componentInstance.value()).toBe(2)
    source.set(3)
    expect(fixture.componentInstance.value()).toBe(3)
  })

  it('allows subscription setup and cleanup to read the result', () => {
    const source = store(1)
    const enabled = signal(true)
    const seen: Array<number> = []
    const fixture = host(() => {
      const value = injectExternalStore(() => ({
        getSnapshot: source.getSnapshot,
        subscribe: enabled()
          ? (notify: () => void) => {
              seen.push(value())
              const cleanup = source.subscribe(notify)
              return () => {
                seen.push(value())
                cleanup()
              }
            }
          : undefined,
      }))
      return value
    })
    fixture.detectChanges()
    enabled.set(false)
    fixture.detectChanges()
    expect(seen).toEqual([1, 1])
  })

  it('keeps snapshot errors separate from subscription errors', () => {
    const source = store(1)
    const fixture = host(() =>
      injectExternalStore(() => ({
        getSnapshot: source.getSnapshot,
        subscribe: () => {
          source.set(2)
          throw new Error('subscribe failed')
        },
      })),
    )
    expect(() => fixture.detectChanges()).toThrow('subscribe failed')
    expect(fixture.componentInstance.value()).toBe(2)
  })

  it('recovers from a snapshot error on the next store notification', () => {
    const source = store(1)
    const fixture = host(() =>
      injectExternalStore(() => ({
        getSnapshot: () => {
          if (source.getSnapshot() === 2) throw new Error('snapshot failed')
          return source.getSnapshot()
        },
        subscribe: source.subscribe,
      })),
    )
    fixture.detectChanges()
    source.set(2)
    expect(() => fixture.componentInstance.value()).toThrow('snapshot failed')
    source.set(3)
    expect(fixture.componentInstance.value()).toBe(3)
    expect(source.subscribe).toHaveBeenCalledOnce()
  })

  it.each([false, true])(
    'releases subscriptions on destruction (during setup: %s)',
    (duringSetup) => {
      const source = store(1)
      const fixture = host(() =>
        injectExternalStore(() => ({
          getSnapshot: source.getSnapshot,
          subscribe: (notify) => {
            const cleanup = source.subscribe(notify)
            if (duringSetup) fixture.destroy()
            return cleanup
          },
        })),
      )
      fixture.detectChanges()
      if (!duringSetup) fixture.destroy()
      expect(source.cleanup).toHaveBeenCalledOnce()
    },
  )

  it('renders required inputs and changes made in ngOnInit', () => {
    const source = store(1)
    @Component({ template: '{{ value() }}' })
    class Example {
      readonly source = input.required<ReturnType<typeof store>>()
      readonly value = injectExternalStore(() => this.source())
      ngOnInit() {
        expect(this.value()).toBe(1)
        this.source().set(2)
      }
    }
    const fixture = TestBed.createComponent(Example, {
      bindings: [inputBinding('source', () => source)],
    })
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toBe('2')
    source.set(3)
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toBe('3')
  })
})
