import type { Ref } from 'vue-demi'

export type MaybeRef<T> = Ref<T> | T

export type MaybeRefDeep<T> = MaybeRef<
  T extends Function
    ? T
    : T extends object
    ? {
        [Property in keyof T]: MaybeRefDeep<T[Property]>
      }
    : T
>

export type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never
