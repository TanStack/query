import type { InjectionKey, Ref } from 'vue'

export const isPendingKey: InjectionKey<Ref<boolean>> = Symbol('isPending')
