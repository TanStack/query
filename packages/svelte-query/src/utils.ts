import type { Readable } from 'svelte/store'
import type { StoreOrVal } from './types'

export function isSvelteStore<T extends object>(
  obj: StoreOrVal<T>,
): obj is Readable<T> {
  return 'subscribe' in obj && typeof obj.subscribe === 'function'
}
