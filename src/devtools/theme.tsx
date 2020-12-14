// @ts-nocheck

import React from 'react'

const ThemeContext = React.createContext()

export function ThemeProvider({ theme, ...rest }) {
  return <ThemeContext.Provider value={theme} {...rest} />
}

export function useTheme() {
  return React.useContext(ThemeContext)
}
