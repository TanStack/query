/* eslint-disable cspell/spellchecker */
/**
 * The code in this file is adapted from NG Extension Platform at https://ngxtension.netlify.app.
 *
 * Original Author: Chau Tran
 *
 * NG Extension Platform is an open-source project licensed under the MIT license.
 *
 * For more information about the original code, see
 * https://github.com/nartc/ngxtension-platform
 */
/* eslint-enable */

import {
  Injector,
  assertInInjectionContext,
  inject,
  runInInjectionContext,
} from '@angular/core'

/**
 * `assertInjector` extends `assertInInjectionContext` with an optional `Injector`
 * After assertion, `assertInjector` runs the `runner` function with the guaranteed `Injector`
 * whether it is the default `Injector` within the current **Injection Context**
 * or the custom `Injector` that was passed in.
 *
 * @template {() => any} Runner - Runner is a function that can return anything
 * @param {Function} fn - the Function to pass in `assertInInjectionContext`
 * @param {Injector | undefined | null} injector - the optional "custom" Injector
 * @param {Runner} runner - the runner fn
 * @returns {ReturnType<Runner>} result - returns the result of the Runner
 *
 * @example
 * ```ts
 * function injectValue(injector?: Injector) {
 *  return assertInjector(injectValue, injector, () => 'value');
 * }
 *
 * injectValue(); // string
 * ```
 */
export function assertInjector<TRunner extends () => any>(
  fn: Function,
  injector: Injector | undefined | null,
  runner: TRunner,
): ReturnType<TRunner>
/**
 * `assertInjector` extends `assertInInjectionContext` with an optional `Injector`
 * After assertion, `assertInjector` returns a guaranteed `Injector` whether it is the default `Injector`
 * within the current **Injection Context** or the custom `Injector` that was passed in.
 *
 * @param {Function} fn - the Function to pass in `assertInInjectionContext`
 * @param {Injector | undefined | null} injector - the optional "custom" Injector
 * @returns Injector
 *
 * @example
 * ```ts
 * function injectDestroy(injector?: Injector) {
 *  injector = assertInjector(injectDestroy, injector);
 *
 *  return runInInjectionContext(injector, () => {
 *    // code
 *  })
 * }
 * ```
 */
export function assertInjector(
  fn: Function,
  injector: Injector | undefined | null,
): Injector
export function assertInjector(
  fn: Function,
  injector: Injector | undefined | null,
  runner?: () => any,
) {
  !injector && assertInInjectionContext(fn)
  const assertedInjector = injector ?? inject(Injector)

  if (!runner) return assertedInjector
  return runInInjectionContext(assertedInjector, runner)
}
