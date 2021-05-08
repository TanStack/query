import React from 'react'

export const defaultTheme = {
  background: '#0b1521',
  backgroundAlt: '#132337',
  foreground: 'white',
  gray: '#3f4e60',
  grayAlt: '#222e3e',
  inputBackgroundColor: '#fff',
  inputTextColor: '#000',
  success: '#00ab52',
  danger: '#ff0085',
  active: '#006bff',
  warning: '#ffb200',
}

interface ProviderProps {
  theme: typeof defaultTheme
}

const ThemeContext = React.createContext(defaultTheme)

export function ThemeProvider({ theme, ...rest }: ProviderProps) {
  return <ThemeContext.Provider value={theme} {...rest} />
}

export function useTheme() {
  return React.useContext(ThemeContext)
}
