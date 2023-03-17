import React from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { useQueryClient, onlineManager } from '@tanstack/react-query'
import { rankItem } from '@tanstack/match-sorter-utils'

import { Panel, Button, Input, Select } from '../styledComponents'
import useSubscribeToQueryCache from '../useSubscribeToQueryCache'
import QueryStatusCount from './Header/QueryStatusCount'
import QueryRow from './QueryRow'
import ActiveQuery from './ActiveQuery'
import type { Side } from '../utils'
import { sortFns, getResizeHandleStyle, defaultPanelSize } from '../utils'
import { ThemeProvider, defaultTheme as theme } from '../theme'
import type { DevToolsErrorType } from '../types'
import useLocalStorage from '../useLocalStorage'
import Logo from '../Logo'
import ScreenReader from '../screenreader'

interface DevtoolsPanelOptions {
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
  onDragStart: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
  /**
   * The position of the React Query devtools panel.
   * Defaults to 'bottom'.
   */
  position?: Side
  /**
   * Handles the panel position select change
   */
  onPositionChange?: (side: Side) => void
  /**
   * Show a close button inside the panel
   */
  showCloseButton?: boolean
  /**
   * Use this to add props to the close button. For example, you can add className, style (merge and override default style), onClick (extend default handler), etc.
   */
  closeButtonProps?: React.ComponentPropsWithoutRef<'button'>
  /**
   * Custom instance of QueryClient
   */
  queryClient?: QueryClient
  /**
   * Use this so you can define custom errors that can be shown in the devtools.
   */
  errorTypes?: DevToolsErrorType[]
}

export const ReactQueryDevtoolsPanel = React.forwardRef<
  HTMLDivElement,
  DevtoolsPanelOptions
>(function ReactQueryDevtoolsPanel(props, ref): React.ReactElement {
  const {
    isOpen = true,
    styleNonce,
    setIsOpen,
    queryClient,
    onDragStart,
    onPositionChange,
    showCloseButton,
    position,
    closeButtonProps = {},
    errorTypes = [],
    ...panelProps
  } = props

  const { onClick: onCloseClick, ...otherCloseButtonProps } = closeButtonProps

  const client = useQueryClient(queryClient)
  const queryCache = client.getQueryCache()

  const [sort, setSort] = useLocalStorage(
    'reactQueryDevtoolsSortFn',
    Object.keys(sortFns)[0],
  )

  const [filter, setFilter] = useLocalStorage('reactQueryDevtoolsFilter', '')

  const [baseSort, setBaseSort] = useLocalStorage(
    'reactQueryDevtoolsBaseSort',
    1,
  )

  const sortFn = React.useMemo(() => sortFns[sort as string], [sort])

  const queriesCount = useSubscribeToQueryCache(
    queryCache,
    () => queryCache.getAll().length,
    !isOpen,
  )

  const [activeQueryHash, setActiveQueryHash] = useLocalStorage(
    'reactQueryDevtoolsActiveQueryHash',
    '',
  )

  const queries = React.useMemo(() => {
    const unsortedQueries = queryCache.getAll()

    if (queriesCount === 0) {
      return []
    }

    const filtered = filter
      ? unsortedQueries.filter(
          (item) => rankItem(item.queryHash, filter).passed,
        )
      : [...unsortedQueries]

    const sorted = sortFn
      ? filtered.sort((a, b) => sortFn(a, b) * (baseSort as number))
      : filtered

    return sorted
  }, [baseSort, sortFn, filter, queriesCount, queryCache])

  const [isMockOffline, setMockOffline] = React.useState(false)

  return (
    <ThemeProvider theme={theme}>
      <Panel
        ref={ref}
        className="ReactQueryDevtoolsPanel"
        aria-label="React Query Devtools Panel"
        id="ReactQueryDevtoolsPanel"
        {...panelProps}
        style={{
          height: defaultPanelSize,
          position: 'relative',
          ...panelProps.style,
        }}
      >
        <style
          nonce={styleNonce}
          dangerouslySetInnerHTML={{
            __html: `
            .ReactQueryDevtoolsPanel * {
              scrollbar-color: ${theme.backgroundAlt} ${theme.gray};
            }

            .ReactQueryDevtoolsPanel *::-webkit-scrollbar, .ReactQueryDevtoolsPanel scrollbar {
              width: 1em;
              height: 1em;
            }

            .ReactQueryDevtoolsPanel *::-webkit-scrollbar-track, .ReactQueryDevtoolsPanel scrollbar-track {
              background: ${theme.backgroundAlt};
            }

            .ReactQueryDevtoolsPanel *::-webkit-scrollbar-thumb, .ReactQueryDevtoolsPanel scrollbar-thumb {
              background: ${theme.gray};
              border-radius: .5em;
              border: 3px solid ${theme.backgroundAlt};
            }
          `,
          }}
        />
        <div
          style={getResizeHandleStyle(position)}
          onMouseDown={onDragStart}
        ></div>

        {isOpen && (
          <div
            style={{
              flex: '1 1 500px',
              minHeight: '40%',
              maxHeight: '100%',
              overflow: 'auto',
              borderRight: `1px solid ${theme.grayAlt}`,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '.5em',
                background: theme.backgroundAlt,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <button
                type="button"
                aria-label="Close React Query Devtools"
                aria-controls="ReactQueryDevtoolsPanel"
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
                <ScreenReader text="Close React Query Devtools" />
              </button>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '.5em',
                  }}
                >
                  <QueryStatusCount queryCache={queryCache} />
                  {position && onPositionChange ? (
                    <Select
                      aria-label="Panel position"
                      value={position}
                      style={{ marginInlineStart: '.5em' }}
                      onChange={(e) => onPositionChange(e.target.value as Side)}
                    >
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                    </Select>
                  ) : null}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5em',
                  }}
                >
                  <Input
                    placeholder="Filter"
                    aria-label="Filter by queryhash"
                    value={filter ?? ''}
                    onChange={(e) => setFilter(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setFilter('')
                    }}
                    style={{
                      flex: '1',
                      width: '100%',
                    }}
                  />
                  <Select
                    aria-label="Sort queries"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    style={{
                      flex: '1',
                      minWidth: 75,
                      marginRight: '.5em',
                    }}
                  >
                    {Object.keys(sortFns).map((key) => (
                      <option key={key} value={key}>
                        Sort by {key}
                      </option>
                    ))}
                  </Select>
                  <Button
                    type="button"
                    onClick={() => setBaseSort((old) => old * -1)}
                    style={{
                      padding: '.3em .4em',
                      marginRight: '.5em',
                    }}
                  >
                    {baseSort === 1 ? '⬆ Asc' : '⬇ Desc'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      if (isMockOffline) {
                        onlineManager.setOnline(undefined)
                        setMockOffline(false)
                        window.dispatchEvent(new Event('online'))
                      } else {
                        onlineManager.setOnline(false)
                        setMockOffline(true)
                      }
                    }}
                    aria-label={
                      isMockOffline
                        ? 'Restore offline mock'
                        : 'Mock offline behavior'
                    }
                    title={
                      isMockOffline
                        ? 'Restore offline mock'
                        : 'Mock offline behavior'
                    }
                    style={{
                      padding: '0',
                      height: '2em',
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="2em"
                      height="2em"
                      viewBox="0 0 24 24"
                      stroke={isMockOffline ? theme.danger : 'currentColor'}
                      fill="none"
                    >
                      {isMockOffline ? (
                        <>
                          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                          <line x1="12" y1="18" x2="12.01" y2="18" />
                          <path d="M9.172 15.172a4 4 0 0 1 5.656 0" />
                          <path d="M6.343 12.343a7.963 7.963 0 0 1 3.864 -2.14m4.163 .155a7.965 7.965 0 0 1 3.287 2" />
                          <path d="M3.515 9.515a12 12 0 0 1 3.544 -2.455m3.101 -.92a12 12 0 0 1 10.325 3.374" />
                          <line x1="3" y1="3" x2="21" y2="21" />
                        </>
                      ) : (
                        <>
                          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                          <line x1="12" y1="18" x2="12.01" y2="18" />
                          <path d="M9.172 15.172a4 4 0 0 1 5.656 0" />
                          <path d="M6.343 12.343a8 8 0 0 1 11.314 0" />
                          <path d="M3.515 9.515c4.686 -4.687 12.284 -4.687 17 0" />
                        </>
                      )}
                    </svg>
                    <ScreenReader
                      text={
                        isMockOffline
                          ? 'Restore offline mock'
                          : 'Mock offline behavior'
                      }
                    />
                  </Button>
                </div>
              </div>
            </div>
            <div
              style={{
                overflowY: 'auto',
                flex: '1',
              }}
            >
              {queries.map((query) => {
                return (
                  <QueryRow
                    queryKey={query.queryKey}
                    activeQueryHash={activeQueryHash}
                    setActiveQueryHash={setActiveQueryHash}
                    key={query.queryHash}
                    queryCache={queryCache}
                  />
                )
              })}
            </div>
          </div>
        )}

        {activeQueryHash && isOpen ? (
          <ActiveQuery
            activeQueryHash={activeQueryHash}
            queryCache={queryCache}
            queryClient={client}
            errorTypes={errorTypes}
          />
        ) : null}

        {showCloseButton ? (
          <Button
            type="button"
            aria-controls="ReactQueryDevtoolsPanel"
            aria-haspopup="true"
            aria-expanded="true"
            {...(otherCloseButtonProps as Record<string, unknown>)}
            style={{
              position: 'absolute',
              zIndex: 99999,
              margin: '.5em',
              bottom: 0,
              left: 0,
              ...otherCloseButtonProps.style,
            }}
            onClick={(e) => {
              setIsOpen(false)
              onCloseClick?.(e)
            }}
          >
            Close
          </Button>
        ) : null}
      </Panel>
    </ThemeProvider>
  )
})

ReactQueryDevtoolsPanel.displayName = 'ReactQueryDevtoolsPanel'

export default ReactQueryDevtoolsPanel
