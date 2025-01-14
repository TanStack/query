import { getIsRestoringContext } from './context.js'
import type { Accessor } from './types.js'

export function useIsRestoring(): Accessor<boolean> {
  return getIsRestoringContext()
}
