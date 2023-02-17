import type { Writable } from 'svelte/store'
import type { WritableOrVal } from './types'

export function isWritable<T extends object>(
  obj: WritableOrVal<T>,
): obj is Writable<T> {
  return 'subscribe' in obj
}
