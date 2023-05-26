import type { Writable } from 'svelte/store'
import type { WritableOrVal } from './types.ts'

export function isWritable<T extends object>(
  obj: WritableOrVal<T>,
): obj is Writable<T> {
  return 'subscribe' in obj && 'set' in obj && 'update' in obj
}
