import { createContext, useContext } from 'octane'

// IsRestoring — true while a persisted client is being restored from storage. While
// restoring, queries read the cache but don't subscribe/fetch (they wait for the
// restore to finish). Defaults to false, so without a provider it's inert.
const IsRestoringContext = createContext(false)

export function useIsRestoring(): boolean {
  return useContext(IsRestoringContext)
}

// `<IsRestoringProvider value={true}>…` — octane's built-in context Provider.
export const IsRestoringProvider = IsRestoringContext.Provider
