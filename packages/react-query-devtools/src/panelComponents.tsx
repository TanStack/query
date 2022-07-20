import * as React from 'react'
import { useTheme } from './theme'
import Logo from './Logo'
import { DevtoolsPanel } from './types'

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
  panel: DevtoolsPanel
  setPanel: (panel: DevtoolsPanel) => void
}) => {
  const theme = useTheme()
  const { children, setIsOpen, panel, setPanel } = props
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
        <button
          type="button"
          aria-label="Switch to Cache Panel"
          onClick={() => setPanel('cache')}
          style={{
            marginLeft: '1rem',
            marginRight: '1rem',
            border: 'none',
            background: 'none',
            color: theme.foreground,
            fontSize: '1.2em',
            opacity: panel === 'cache' ? 1 : 0.7,
            cursor: 'pointer',
          }}
        >
          Cache
        </button>
        <button
          type="button"
          aria-label="Switch to Timeline Panel"
          onClick={() => setPanel('timeline')}
          style={{
            marginRight: '1rem',
            border: 'none',
            background: 'none',
            color: theme.foreground,
            fontSize: '1.2em',
            opacity: panel === 'timeline' ? 1 : 0.7,
            cursor: 'pointer',
          }}
        >
          Timeline
        </button>
      </div>
      {children}
    </div>
  )
}
