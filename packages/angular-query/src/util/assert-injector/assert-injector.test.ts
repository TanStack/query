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
  InjectionToken,
  Injector,
  inject,
  provideExperimentalZonelessChangeDetection,
  runInInjectionContext,
} from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { assertInjector } from './assert-injector'

describe('assertInjector', () => {
  const token = new InjectionToken('token', {
    factory: () => 1,
  })

  function injectDummy(injector?: Injector) {
    injector = assertInjector(injectDummy, injector)
    return runInInjectionContext(injector, () => inject(token))
  }

  function injectDummyTwo(injector?: Injector) {
    return assertInjector(injectDummyTwo, injector, () => inject(token) + 1)
  }

  it('given no custom injector, when run in injection context, then return value', () => {
    TestBed.configureTestingModule({
      providers: [provideExperimentalZonelessChangeDetection()],
    })
    TestBed.runInInjectionContext(() => {
      const value = injectDummy()
      const valueTwo = injectDummyTwo()
      expect(value).toEqual(1)
      expect(valueTwo).toEqual(2)
    })
  })

  it('given no custom injector, when run outside injection context, then throw', () => {
    expect(() => injectDummy()).toThrowError(
      /injectDummy\(\) can only be used within an injection context/i,
    )
    expect(() => injectDummyTwo()).toThrowError(
      /injectDummyTwo\(\) can only be used within an injection context/i,
    )
  })

  it('given a custom injector, when run in that injector context without providing number, then throw', () => {
    expect(() => injectDummy(Injector.create({ providers: [] }))).toThrowError(
      /No provider for InjectionToken/i,
    )
    expect(() =>
      injectDummyTwo(Injector.create({ providers: [] })),
    ).toThrowError(/No provider for InjectionToken/i)
  })

  it('given a custom injector, when run in that injector context and providing number, then return value', () => {
    const value = injectDummy(
      Injector.create({ providers: [{ provide: token, useValue: 2 }] }),
    )
    const valueTwo = injectDummyTwo(
      Injector.create({ providers: [{ provide: token, useValue: 2 }] }),
    )
    expect(value).toEqual(2)
    expect(valueTwo).toEqual(3)
  })
})
