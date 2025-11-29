---
id: CancelledError
title: CancelledError
---

# Class: CancelledError

Defined in: [packages/query-core/src/retryer.ts:58](https://github.com/TanStack/query/blob/main/packages/query-core/src/retryer.ts#L58)

## Extends

- `Error`

## Constructors

### Constructor

```ts
new CancelledError(options?): CancelledError;
```

Defined in: [packages/query-core/src/retryer.ts:61](https://github.com/TanStack/query/blob/main/packages/query-core/src/retryer.ts#L61)

#### Parameters

##### options?

[`CancelOptions`](../interfaces/CancelOptions.md)

#### Returns

`CancelledError`

#### Overrides

```ts
Error.constructor
```

## Properties

### cause?

```ts
optional cause: unknown;
```

Defined in: node\_modules/.pnpm/typescript@5.8.3/node\_modules/typescript/lib/lib.es2022.error.d.ts:26

#### Inherited from

```ts
Error.cause
```

***

### message

```ts
message: string;
```

Defined in: node\_modules/.pnpm/typescript@5.8.3/node\_modules/typescript/lib/lib.es5.d.ts:1077

#### Inherited from

```ts
Error.message
```

***

### name

```ts
name: string;
```

Defined in: node\_modules/.pnpm/typescript@5.8.3/node\_modules/typescript/lib/lib.es5.d.ts:1076

#### Inherited from

```ts
Error.name
```

***

### revert?

```ts
optional revert: boolean;
```

Defined in: [packages/query-core/src/retryer.ts:59](https://github.com/TanStack/query/blob/main/packages/query-core/src/retryer.ts#L59)

***

### silent?

```ts
optional silent: boolean;
```

Defined in: [packages/query-core/src/retryer.ts:60](https://github.com/TanStack/query/blob/main/packages/query-core/src/retryer.ts#L60)

***

### stack?

```ts
optional stack: string;
```

Defined in: node\_modules/.pnpm/typescript@5.8.3/node\_modules/typescript/lib/lib.es5.d.ts:1078

#### Inherited from

```ts
Error.stack
```

***

### prepareStackTrace()?

```ts
static optional prepareStackTrace: (err, stackTraces) => any;
```

Defined in: node\_modules/.pnpm/@types+node@22.15.3/node\_modules/@types/node/globals.d.ts:143

Optional override for formatting stack traces

#### Parameters

##### err

`Error`

##### stackTraces

`CallSite`[]

#### Returns

`any`

#### See

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Inherited from

```ts
Error.prepareStackTrace
```

***

### stackTraceLimit

```ts
static stackTraceLimit: number;
```

Defined in: node\_modules/.pnpm/@types+node@22.15.3/node\_modules/@types/node/globals.d.ts:145

#### Inherited from

```ts
Error.stackTraceLimit
```

## Methods

### captureStackTrace()

```ts
static captureStackTrace(targetObject, constructorOpt?): void;
```

Defined in: node\_modules/.pnpm/@types+node@22.15.3/node\_modules/@types/node/globals.d.ts:136

Create .stack property on a target object

#### Parameters

##### targetObject

`object`

##### constructorOpt?

`Function`

#### Returns

`void`

#### Inherited from

```ts
Error.captureStackTrace
```
