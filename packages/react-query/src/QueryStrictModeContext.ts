'use client'
import * as React from 'react'
import type { QueryStrictModeValue } from './QueryStrictModeTypes'

const QueryStrictModeContext = React.createContext<QueryStrictModeValue | null>(
  null,
)

/**
 * Reads the nearest `QueryStrictMode`.
 * @returns The value of the nearest `QueryStrictMode`, or `null` outside of one.
 */
export const useQueryStrictMode = () => React.useContext(QueryStrictModeContext)

/**
 * The Provider that `QueryStrictMode` uses to share its value with the hooks below it, read by
 * `useQueryStrictMode`.
 */
export const QueryStrictModeProvider = QueryStrictModeContext.Provider
