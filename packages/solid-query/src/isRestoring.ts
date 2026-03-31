import { createContext, useContext } from 'solid-js'
import type { Accessor } from 'solid-js'

const IsRestoringContext = createContext<Accessor<boolean>>(() => false)

export const useIsRestoring = () => useContext(IsRestoringContext)
export const IsRestoringProvider = IsRestoringContext.Provider
