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
  type EnvironmentProviders,
  type FactoryProvider,
  type Host,
  type InjectOptions,
  InjectionToken,
  type Injector,
  type Optional,
  type Provider,
  type Self,
  type SkipSelf,
  type Type,
  inject,
  runInInjectionContext,
} from '@angular/core'
import { assertInjector } from '../assert-injector/assert-injector'

type CreateInjectionTokenDep<TTokenType> =
  | Type<TTokenType>
  // NOTE: we don't have an AbstractType
  | (abstract new (...args: Array<any>) => TTokenType)
  | InjectionToken<TTokenType>

type CreateInjectionTokenDeps<
  TFactory extends (...args: Array<any>) => any,
  TFactoryDeps extends Parameters<TFactory> = Parameters<TFactory>,
> = {
  [Index in keyof TFactoryDeps]:
    | CreateInjectionTokenDep<TFactoryDeps[Index]>
    | [
        ...modifiers: Array<Optional | Self | SkipSelf | Host>,
        token: CreateInjectionTokenDep<TFactoryDeps[Index]>,
      ]
} & { length: TFactoryDeps['length'] }

type CreateInjectionTokenOptions<
  TFactory extends (...args: Array<any>) => any,
  TFactoryDeps extends Parameters<TFactory> = Parameters<TFactory>,
> =
  // this means TFunction has no parameters
  (TFactoryDeps[0] extends undefined
    ? { deps?: never }
    : { deps: CreateInjectionTokenDeps<TFactory, TFactoryDeps> }) & {
    isRoot?: boolean
    multi?: boolean
    token?: InjectionToken<ReturnType<TFactory>>
    extraProviders?: Provider | EnvironmentProviders
  }

type CreateProvideFnOptions<
  TFactory extends (...args: Array<any>) => any,
  TFactoryDeps extends Parameters<TFactory> = Parameters<TFactory>,
> = Pick<
  CreateInjectionTokenOptions<TFactory, TFactoryDeps>,
  'deps' | 'extraProviders' | 'multi'
>

type InjectFn<TFactoryReturn> = {
  (): TFactoryReturn
  (
    injectOptions: InjectOptions & { optional?: false } & {
      injector?: Injector
    },
  ): TFactoryReturn
  (
    injectOptions: InjectOptions & { injector?: Injector },
  ): TFactoryReturn | null
}

type ProvideFn<
  TNoop extends boolean,
  TFactoryReturn,
  TReturn = TFactoryReturn extends Array<infer Item> ? Item : TFactoryReturn,
> = (TNoop extends true
  ? (value: TReturn | (() => TReturn)) => Provider
  : () => Provider) &
  (TReturn extends Function
    ? (value: TReturn | (() => TReturn), isFunctionValue: boolean) => Provider
    : (value: TReturn | (() => TReturn)) => Provider)

type CreateInjectionTokenReturn<
  TFactoryReturn,
  TNoop extends boolean = false,
> = [
  InjectFn<TFactoryReturn>,
  ProvideFn<TNoop, TFactoryReturn>,
  InjectionToken<TFactoryReturn>,
  () => Provider,
]

function createInjectFn<TValue>(token: InjectionToken<TValue>) {
  return function (
    this: Function,
    {
      injector,
      ...injectOptions
    }: InjectOptions & { injector?: Injector } = {},
  ) {
    injector = assertInjector(this, injector)
    return runInInjectionContext(injector, () =>
      inject(token, injectOptions as InjectOptions),
    )
  }
}

function createProvideFn<
  TValue,
  TFactory extends (...args: Array<any>) => any = (
    ...args: Array<any>
  ) => TValue,
  TFactoryDeps extends Parameters<TFactory> = Parameters<TFactory>,
>(
  token: InjectionToken<TValue>,
  factory: (...args: Array<any>) => TValue,
  opts: CreateProvideFnOptions<TFactory, TFactoryDeps> = {},
) {
  const { deps = [], multi = false, extraProviders = [] } = opts
  return (value?: TValue | (() => TValue), isFunctionValue = false) => {
    let provider: Provider
    if (value !== undefined) {
      // eslint-disable-next-line no-shadow
      const factory =
        typeof value === 'function'
          ? isFunctionValue
            ? () => value
            : value
          : () => value

      provider = {
        provide: token,
        useFactory: factory,
        multi,
      }
    } else {
      provider = {
        provide: token,
        useFactory: factory,
        deps: deps as FactoryProvider['deps'],
        multi,
      }
    }

    return [extraProviders, provider]
  }
}

export function createNoopInjectionToken<
  TValue,
  TMulti extends boolean = false,
  TOptions = Pick<
    CreateInjectionTokenOptions<() => void, []>,
    'extraProviders'
  > &
    (TMulti extends true ? { multi: true } : Record<string, never>),
>(description: string, options?: TOptions) {
  type TReturn = TMulti extends true ? Array<TValue> : TValue

  const token =
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    (options as CreateInjectionTokenOptions<() => void, []>)?.token ||
    new InjectionToken<TReturn>(description)
  return [
    createInjectFn(token) as CreateInjectionTokenReturn<TReturn, true>[0],
    createProvideFn(
      token,
      () => null!,
      (options || {}) as CreateProvideFnOptions<() => void, []>,
    ) as CreateInjectionTokenReturn<TReturn, true>[1],
    token,
    () => {},
  ] as CreateInjectionTokenReturn<TReturn, true>
}
