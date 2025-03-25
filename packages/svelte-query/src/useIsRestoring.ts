import { getIsRestoringContext } from './context.js'

export function useIsRestoring(): () => boolean {
  return getIsRestoringContext()
}
