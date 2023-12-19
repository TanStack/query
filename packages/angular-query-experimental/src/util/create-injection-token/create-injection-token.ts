import {
  ENVIRONMENT_INITIALIZER,
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
} from '@angular/core';
import { assertInjector } from '../assert-injector/assert-injector';

// original source and credits to https://github.com/nartc/ngxtension-platform/blob/main/libs/ngxtension/create-injection-token/src/create-injection-token.ts

type CreateInjectionTokenDep<TTokenType> =
  | Type<TTokenType>
  // NOTE: we don't have an AbstractType
  | (abstract new (...args: Array<any>) => TTokenType)
  | InjectionToken<TTokenType>;

type CreateInjectionTokenDeps<
  TFactory extends (...args: Array<any>) => any,
  TFactoryDeps extends Parameters<TFactory> = Parameters<TFactory>,
> = {
  [Index in keyof TFactoryDeps]:
  | CreateInjectionTokenDep<TFactoryDeps[Index]>
  | [
  ...modifiers: Array<Optional | Self | SkipSelf | Host>,
  token: CreateInjectionTokenDep<TFactoryDeps[Index]>,
];
} & { length: TFactoryDeps['length'] };

export type CreateInjectionTokenOptions<
  TFactory extends (...args: Array<any>) => any,
  TFactoryDeps extends Parameters<TFactory> = Parameters<TFactory>,
> =
// this means TFunction has no parameters
  (TFactoryDeps[0] extends undefined
    ? { deps?: never }
    : { deps: CreateInjectionTokenDeps<TFactory, TFactoryDeps> }) & {
  isRoot?: boolean;
  multi?: boolean;
  token?: InjectionToken<ReturnType<TFactory>>;
  extraProviders?: Provider | EnvironmentProviders;
};

type CreateProvideFnOptions<
  TFactory extends (...args: Array<any>) => any,
  TFactoryDeps extends Parameters<TFactory> = Parameters<TFactory>,
> = Pick<
  CreateInjectionTokenOptions<TFactory, TFactoryDeps>,
  'deps' | 'extraProviders' | 'multi'
>;

type InjectFn<TFactoryReturn> = {
  (): TFactoryReturn;
  (
    injectOptions: InjectOptions & { optional?: false } & {
      injector?: Injector;
    },
  ): TFactoryReturn;
  (
    injectOptions: InjectOptions & { injector?: Injector },
  ): TFactoryReturn | null;
};

type ProvideFn<
  TNoop extends boolean,
  TFactoryReturn,
  TReturn = TFactoryReturn extends Array<infer Item> ? Item : TFactoryReturn,
> = (TNoop extends true
  ? (value: TReturn | (() => TReturn)) => Provider
  : () => Provider) &
  (TReturn extends Function
    ? (value: TReturn | (() => TReturn), isFunctionValue: boolean) => Provider
    : (value: TReturn | (() => TReturn)) => Provider);

export type CreateInjectionTokenReturn<
  TFactoryReturn,
  TNoop extends boolean = false,
> = [
  InjectFn<TFactoryReturn>,
  ProvideFn<TNoop, TFactoryReturn>,
  InjectionToken<TFactoryReturn>,
  () => Provider,
];

function createInjectFn<TValue>(token: InjectionToken<TValue>) {
  return function (
    this: Function,
    {
      injector,
      ...injectOptions
    }: InjectOptions & { injector?: Injector } = {},
  ) {
    injector = assertInjector(this, injector);
    return runInInjectionContext(injector, () =>
      inject(token, injectOptions as InjectOptions),
    );
  };
}

function createProvideFn<
  TValue,
  TFactory extends (...args: Array<any>) => any = (...args: Array<any>) => TValue,
  TFactoryDeps extends Parameters<TFactory> = Parameters<TFactory>,
>(
  token: InjectionToken<TValue>,
  factory: (...args: Array<any>) => TValue,
  opts: CreateProvideFnOptions<TFactory, TFactoryDeps> = {},
) {
  const { deps = [], multi = false, extraProviders = [] } = opts;
  return (value?: TValue | (() => TValue), isFunctionValue = false) => {
    let provider: Provider;
    if (typeof value !== 'undefined') {

      // eslint-disable-next-line no-shadow
      const factory =
        typeof value === 'function'
          ? isFunctionValue
            ? () => value
            : value
          : () => value;

      provider = {
        provide: token,
        useFactory: factory,
        multi,
      };
    } else {
      provider = {
        provide: token,
        useFactory: factory,
        deps: deps as FactoryProvider['deps'],
        multi,
      };
    }

    return [extraProviders, provider];
  };
}

/**
 * `createInjectionToken` accepts a factory function and returns a tuple of `injectFn`, `provideFn`, and the `InjectionToken`
 * that the factory function is for.
 *
 * @param {Function} factory - Factory Function that returns the value for the `InjectionToken`
 * @param {CreateInjectionTokenOptions} options - object to control how the `InjectionToken` behaves
 * @returns {CreateInjectionTokenReturn}
 *
 * @example
 * ```ts
 * const [injectCounter, provideCounter, COUNTER] = createInjectionToken(() => signal(0));
 *
 * export class Counter {
 *  counter = injectCounter(); // WritableSignal<number>
 * }
 * ```
 */
export function createInjectionToken<
  TFactory extends (...args: Array<any>) => any,
  TFactoryDeps extends Parameters<TFactory> = Parameters<TFactory>,
  TOptions extends CreateInjectionTokenOptions<
    TFactory,
    TFactoryDeps
  > = CreateInjectionTokenOptions<TFactory, TFactoryDeps>,
  TFactoryReturn = TOptions['multi'] extends true
    ? Array<ReturnType<TFactory>>
    : ReturnType<TFactory>,
>(
  factory: TFactory,
  options?: TOptions,
): CreateInjectionTokenReturn<TFactoryReturn> {
  const tokenName = factory.name || factory.toString();
  const opts =
    options ??
    ({ isRoot: true } as CreateInjectionTokenOptions<TFactory, TFactoryDeps>);

  opts.isRoot ??= true;

  // NOTE: multi tokens cannot be a root token. It has to be provided (provideFn needs to be invoked)
  // for the 'multi' flag to work properly
  if (opts.multi) {
    opts.isRoot = false;
  }

  if (opts.isRoot) {
    if (opts.token) {
      throw new Error(`\
createInjectionToken is creating a root InjectionToken but an external token is passed in.
`);
    }

    const token = new InjectionToken<TFactoryReturn>(`Token for ${tokenName}`, {
      factory: () => {
        if (opts.deps && Array.isArray(opts.deps)) {
          return factory(...opts.deps.map((dep) => inject(dep)));
        }
        return factory();
      },
    });

    const injectFn = createInjectFn(
      token,
    ) as CreateInjectionTokenReturn<TFactoryReturn>[0];

    return [
      injectFn,
      createProvideFn(
        token,
        factory,
        opts as CreateProvideFnOptions<TFactory, TFactoryDeps>,
      ) as CreateInjectionTokenReturn<TFactoryReturn>[1],
      token,
      () => ({
        provide: ENVIRONMENT_INITIALIZER,
        useValue: () => injectFn(),
        multi: true,
      }),
    ];
  }

  const token =
    opts.token || new InjectionToken<TFactoryReturn>(`Token for ${tokenName}`);
  return [
    createInjectFn(token) as CreateInjectionTokenReturn<TFactoryReturn>[0],
    createProvideFn(
      token,
      factory,
      opts as CreateProvideFnOptions<TFactory, TFactoryDeps>,
    ) as CreateInjectionTokenReturn<TFactoryReturn>[1],
    token,
    () => [],
  ];
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
  type TReturn = TMulti extends true ? Array<TValue> : TValue;

  const token =
    (options as CreateInjectionTokenOptions<() => void, []>).token ||
    new InjectionToken<TReturn>(description);
  return [
    createInjectFn(token) as CreateInjectionTokenReturn<TReturn, true>[0],
    createProvideFn(
      token,
      () => null!,
      (options || {}) as CreateProvideFnOptions<() => void, []>,
    ) as CreateInjectionTokenReturn<TReturn, true>[1],
    token,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    () => {},
  ] as CreateInjectionTokenReturn<TReturn, true>;
}
