import { getIsRestoringContext } from './context.js'
import type { Readable } from 'svelte/store'

export function useIsRestoring(): Readable<boolean> {
  return getIsRestoringContext()
}
