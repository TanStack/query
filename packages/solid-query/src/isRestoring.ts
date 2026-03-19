import { createContext, useContext } from 'solid-js'
import type { Accessor } from 'solid-js'

export const IsRestoringContext = createContext<Accessor<boolean>>(() => false)

export const useIsRestoring = () => useContext(IsRestoringContext)
