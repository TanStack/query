import { getIsRestoringContext } from './context'
import type { Readable } from 'svelte/store'

export function useIsRestoring(): Readable<boolean> {
  return getIsRestoringContext()
}
