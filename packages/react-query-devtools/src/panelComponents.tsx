import * as React from 'react'
import { useTheme } from './theme'
import Logo from './Logo'

export const PanelMain = (props: {
  isOpen?: boolean
  children?: React.ReactNode
}) => {
  const theme = useTheme()
  return (
    <div
      style={{
        flex: '1 1 500px',
        minHeight: '40%',
        maxHeight: '100%',
        overflow: 'auto',
        borderRight: `1px solid ${theme.grayAlt}`,
        display: props.isOpen ? 'flex' : 'none',
        flexDirection: 'column',
      }}
    >
      {props.children}
    </div>
  )
}

export const PanelHead = (props: {
  children?: React.ReactNode
  setIsOpen: (isOpen: boolean) => void
}) => {
  const theme = useTheme()
  const { children, setIsOpen } = props
  return (
    <div
      style={{
        padding: '.5em',
        background: theme.backgroundAlt,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          type="button"
          aria-label="Close React Query Devtools"
          aria-controls="CachePanel"
          aria-haspopup="true"
          aria-expanded="true"
          onClick={() => setIsOpen(false)}
          style={{
            display: 'inline-flex',
            background: 'none',
            border: 0,
            padding: 0,
            marginRight: '.5em',
            cursor: 'pointer',
          }}
        >
          <Logo aria-hidden />
        </button>
        <div>Cache</div>
        <div>Timeline</div>
      </div>
      {children}
    </div>
  )
}
