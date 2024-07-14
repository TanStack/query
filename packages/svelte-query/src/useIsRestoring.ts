import { getIsRestoringContext } from './context'

export function useIsRestoring(): () => boolean {
  return getIsRestoringContext()
}
