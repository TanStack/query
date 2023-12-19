import type { Ref, UnwrapRef } from 'vue-demi'

type Primitive = string | number | boolean | bigint | symbol | undefined | null
type UnwrapLeaf =
  | Primitive
  | Function
  | Date
  | Error
  | RegExp
  | Map<any, any>
  | WeakMap<any, any>
  | Set<any>
  | WeakSet<any>

export type MaybeRef<T> = Ref<T> | T

export type MaybeRefOrGetter<T> = MaybeRef<T> | (() => T)

export type MaybeRefDeep<T> = MaybeRef<
  T extends Function
    ? T
    : T extends object
      ? {
          [Property in keyof T]: MaybeRefDeep<T[Property]>
        }
      : T
>

export type NoUnknown<T> = Equal<unknown, T> extends true ? never : T

export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <
  T,
>() => T extends Y ? 1 : 2
  ? true
  : false

export type DeepUnwrapRef<T> = T extends UnwrapLeaf
  ? T
  : T extends Ref<infer U>
    ? DeepUnwrapRef<U>
    : T extends {}
      ? {
          [Property in keyof T]: DeepUnwrapRef<T[Property]>
        }
      : UnwrapRef<T>

export type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never
