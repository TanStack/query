import { isSignal, untracked } from '@angular/core'
import { SIGNAL, signalSetFn } from '@angular/core/primitives/signals'
import { expect } from 'vitest'
import type { InputSignal, Signal } from '@angular/core'
import type { ComponentFixture } from '@angular/core/testing'

/* eslint jsdoc/require-jsdoc: 0, jsdoc/require-param: 0 */

// Evaluate all signals on an object and return the result
function evaluateSignals<T extends Record<string, any>>(
  obj: T,
): { [K in keyof T]: ReturnType<T[K]> } {
  const result: Partial<{ [K in keyof T]: ReturnType<T[K]> }> = {}

  untracked(() => {
    for (const key in obj) {
      if (
        Object.prototype.hasOwnProperty.call(obj, key) &&
        // Only evaluate signals, not normal functions
        isSignal(obj[key])
      ) {
        const func = obj[key]
        result[key] = func()
      }
    }
  })

  return result as { [K in keyof T]: ReturnType<T[K]> }
}

export const expectSignals = <T extends Record<string, any>>(
  obj: T,
  expected: Partial<{
    [K in keyof T]: T[K] extends Signal<any> ? ReturnType<T[K]> : never
  }>,
): void => {
  expect(evaluateSignals(obj)).toMatchObject(expected)
}

type ToSignalInputUpdatableMap<T> = {
  [K in keyof T as T[K] extends InputSignal<any>
    ? K
    : never]: T[K] extends InputSignal<infer Value> ? Value : never
}

function componentHasSignalInputProperty<TProperty extends string>(
  component: object,
  property: TProperty,
): component is { [key in TProperty]: InputSignal<unknown> } {
  return (
    component.hasOwnProperty(property) && (component as any)[property][SIGNAL]
  )
}

/**
 * Set required signal input value to component fixture
 * @see https://github.com/angular/angular/issues/54013
 */
export function setSignalInputs<T extends NonNullable<unknown>>(
  component: T,
  inputs: ToSignalInputUpdatableMap<T>,
) {
  for (const inputKey in inputs) {
    if (componentHasSignalInputProperty(component, inputKey)) {
      signalSetFn(component[inputKey][SIGNAL], inputs[inputKey])
    }
  }
}

export function setFixtureSignalInputs<T extends NonNullable<unknown>>(
  componentFixture: ComponentFixture<T>,
  inputs: ToSignalInputUpdatableMap<T>,
  options: { detectChanges: boolean } = { detectChanges: true },
) {
  setSignalInputs(componentFixture.componentInstance, inputs)
  if (options.detectChanges) {
    componentFixture.detectChanges()
  }
}
