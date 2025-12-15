'use client'

import { createContext } from 'preact'
import { useContext } from 'preact/hooks'

const IsRestoringContext = createContext(false)

export const useIsRestoring = () => useContext(IsRestoringContext)
export const IsRestoringProvider = IsRestoringContext.Provider
