'use client'
import * as React from 'react'

import type { PauseManager } from '@tanstack/query-core'

export const PauseManagerContext = React.createContext<
  PauseManager | undefined
>(undefined)

export const usePauseManager = () => {
  return React.useContext(PauseManagerContext)
}

export type PauseManagerProviderProps = {
  pauseManager: PauseManager
  children?: React.ReactNode
}

export const PauseManagerProvider = ({
  pauseManager,
  children,
}: PauseManagerProviderProps): React.JSX.Element => {
  return (
    <PauseManagerContext.Provider value={pauseManager}>
      {children}
    </PauseManagerContext.Provider>
  )
}
