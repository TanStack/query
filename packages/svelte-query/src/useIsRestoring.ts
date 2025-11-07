import { getIsRestoringContext } from './context.js'
import type { Box } from './containers.svelte.js'

export function useIsRestoring(): Box<boolean> {
  return getIsRestoringContext()
}
