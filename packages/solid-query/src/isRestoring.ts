// based on react-query/src/isRestoring.tsx

import { createContext, useContext } from 'solid-js'

const isRestoring = () => false
const IsRestoringContext = createContext(isRestoring)

const useIsRestoring = () => useContext(IsRestoringContext)
const IsRestoringProvider = IsRestoringContext.Provider

export { IsRestoringContext, IsRestoringProvider, useIsRestoring }
