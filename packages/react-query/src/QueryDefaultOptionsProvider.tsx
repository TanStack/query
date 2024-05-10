'use client'
import * as React from 'react'
import { type DefaultOptions } from '@tanstack/query-core'

export const QueryDefaultOptionsContext = React.createContext<
  Pick<DefaultOptions, 'queries'> | undefined
>(undefined)

export const useQueryDefaultOptions = () => {
  return React.useContext(QueryDefaultOptionsContext)
}

export type QueryDefaultOptionsProviderProps = {
  options: Pick<DefaultOptions, 'queries'>
  children?: React.ReactNode
}

export const QueryDefaultOptionsProvider = ({
  options,
  children,
}: QueryDefaultOptionsProviderProps): JSX.Element => {
  return (
    <QueryDefaultOptionsContext.Provider value={options}>
      {children}
    </QueryDefaultOptionsContext.Provider>
  )
}
