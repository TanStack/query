import * as React from 'react'
import { ContextOptions } from '@tanstack/react-query'
import { Panel } from './styledComponents'
import { ThemeProvider, defaultTheme as theme } from './theme'
import CachePanel from './cache'

interface DevtoolsPanelOptions extends ContextOptions {
  /**
   * The standard React style object used to style a component with inline styles
   */
  style?: React.CSSProperties
  /**
   * The standard React className property used to style a component with classes
   */
  className?: string
  /**
   * A boolean variable indicating whether the panel is open or closed
   */
  isOpen?: boolean
  /**
   * nonce for style element for CSP
   */
  styleNonce?: string
  /**
   * A function that toggles the open and close state of the panel
   */
  setIsOpen: (isOpen: boolean) => void
  /**
   * Handles the opening and closing the devtools panel
   */
  handleDragStart: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
}

export const ReactQueryDevtoolsPanel = React.forwardRef<
  HTMLDivElement,
  DevtoolsPanelOptions
>((props, ref) => {
  const {
    isOpen = true,
    styleNonce,
    setIsOpen,
    handleDragStart,
    context,
    ...panelProps
  } = props
  return (
    <ThemeProvider theme={theme}>
      <Panel
        ref={ref}
        className="CachePanel"
        aria-label="React Query Devtools Panel"
        id="CachePanel"
        {...panelProps}
      >
        <style
          nonce={styleNonce}
          dangerouslySetInnerHTML={{
            __html: `
            .CachePanel * {
              scrollbar-color: ${theme.backgroundAlt} ${theme.gray};
            }

            .CachePanel *::-webkit-scrollbar, .ReactQueryDevtoolsPanel scrollbar {
              width: 1em;
              height: 1em;
            }

            .CachePanel *::-webkit-scrollbar-track, .ReactQueryDevtoolsPanel scrollbar-track {
              background: ${theme.backgroundAlt};
            }

            .CachePanel *::-webkit-scrollbar-thumb, .ReactQueryDevtoolsPanel scrollbar-thumb {
              background: ${theme.gray};
              border-radius: .5em;
              border: 3px solid ${theme.backgroundAlt};
            }
          `,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '4px',
            marginBottom: '-4px',
            cursor: 'row-resize',
            zIndex: 100000,
          }}
          onMouseDown={handleDragStart}
        ></div>
        <CachePanel context={context} isOpen={isOpen} setIsOpen={setIsOpen} />
      </Panel>
    </ThemeProvider>
  )
})

export default ReactQueryDevtoolsPanel
