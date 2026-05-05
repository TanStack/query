export type Accessor<T> = T | (() => T)

export function readAccessor<T>(value: Accessor<T>): T {
  return typeof value === 'function' ? (value as () => T)() : value
}

export type ValueAccessor<T> = (() => T) & {
  readonly current: T
}

export function createValueAccessor<T>(getter: () => T): ValueAccessor<T> {
  const accessor = (() => getter()) as ValueAccessor<T>
  Object.defineProperty(accessor, 'current', {
    get: getter,
    enumerable: true,
  })
  return accessor
}
