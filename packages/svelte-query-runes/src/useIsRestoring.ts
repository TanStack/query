import { getIsRestoringContext } from './context'

export function useIsRestoring() {
  return getIsRestoringContext()
}
