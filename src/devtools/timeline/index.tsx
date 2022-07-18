import React from 'react'

import useLocalStorage from '../useLocalStorage'

import { Panel, Code, Input } from '../styledComponents'
import { ThemeProvider, defaultTheme as theme } from '../theme'
import Logo from '../Logo'

import useTimelineEvents, {
  ReactQueryDevtoolsQueryEventGroup,
  ReactQueryQueryEvent,
} from './useTimelineEvents'
import { matchSorter } from 'match-sorter'

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
   * variable indicating whether the panel is open or closed
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

type ActionType = NonNullable<ReactQueryQueryEvent['actionType']>

const ActionColors: Record<ActionType, string> = {
  continue: '#7BFFA0',
  error: '#FF4154',
  failed: '#BE0027',
  invalidate: '#FF9CA0',
  fetch: '#006BFF',
  pause: '#D5F0FF',
  setState: '#B53DD1',
  success: '#00AB52',
}

function getActionColor(action: ActionType | null) {
  return action && action in ActionColors ? ActionColors[action] : '#000000'
}

function ReactQueryDevtoolsQueryBox({
  query,
  timeRange,
}: {
  query: ReactQueryDevtoolsQueryEventGroup
  timeRange: { start: Date; end: Date | null }
}) {
  const { events } = query
  const boxes = React.useMemo(() => {
    const sortedEvents = events.sort(
      (a, b) => a.receivedAt.getTime() - b.receivedAt.getTime()
    )
    console.log(sortedEvents)
    type Box = {
      startAt: Date
      endAt: Date
      updates: { at: Date; action: ActionType | null }[]
      removed?: boolean
      cacheTime?: number
    }
    const items: Box[] = []
    let partial: Partial<Box> = {}
    sortedEvents.forEach(event => {
      if (event.eventType === 'queryAdded') {
        partial.startAt = event.receivedAt
      } else if (event.eventType === 'queryRemoved') {
        partial.endAt = event.receivedAt
        partial.startAt ??= timeRange.start
        partial.removed = true
        partial.cacheTime = event.cacheTime
        items.push(partial as Box)
        partial = {}
      } else {
        partial.startAt ??= timeRange.start
        if (!partial.updates) {
          partial.updates = []
        }
        partial.updates.push({ at: event.receivedAt, action: event.actionType })
      }
    })
    if (partial.startAt) {
      partial.endAt = timeRange.end || new Date()
      items.push(partial as Box)
      partial = {}
    }
    if (partial.endAt) {
      partial.startAt = timeRange.start
      items.push(partial as Box)
    }
    return items
  }, [events, timeRange.start, timeRange.end])

  const scaleX = (x: Date) => {
    const translatedX = x.getTime() - timeRange.start.getTime()
    // "1px" === 200ms
    return translatedX / 200
  }
  return (
    <svg
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-2 -2 100 9"
      preserveAspectRatio="xMinYMax meet"
    >
      {boxes.map((item, i) => (
        <g key={i}>
          <rect
            x={scaleX(item.startAt)}
            y="0"
            width={scaleX(item.endAt) - scaleX(item.startAt)}
            height="7"
            fill="#FFB200"
            style={{
              transition: 'width 0.05s ease-out',
            }}
          />
          {item.removed && item.cacheTime && (
            <rect
              x={scaleX(item.endAt) - item.cacheTime / 200}
              y="0"
              width={item.cacheTime / 200}
              height="7"
              fill="#BBBBBB"
            />
          )}
          {item.updates?.map((update, i) => (
            <React.Fragment key={i}>
              <circle
                cx={scaleX(update.at)}
                cy="0"
                r="1"
                fill={getActionColor(update.action)}
              >
                <title>{update.action}</title>
              </circle>
              <rect
                x={scaleX(update.at) - 0.25}
                y="0"
                width="0.5"
                height="7"
                fill={getActionColor(update.action)}
              >
                <title>{update.action}</title>
              </rect>
            </React.Fragment>
          ))}
        </g>
      ))}
    </svg>
  )
}

export const ReactQueryDevtoolsPanel = React.forwardRef<
  HTMLDivElement,
  DevtoolsPanelOptions
>(function ReactQueryDevtoolsPanel(props, ref): React.ReactElement {
  const {
    isOpen = true,
    styleNonce,
    setIsOpen,
    handleDragStart,
    ...panelProps
  } = props

  const timelineEvents = useTimelineEvents()

  const [filter, setFilter] = useLocalStorage('reactQueryDevtoolsFilter', '')

  const [activeQueryHash, setActiveQueryHash] = useLocalStorage(
    'reactQueryDevtoolsActiveQueryHash',
    ''
  )

  const { queries: allQueries, timeRange } = timelineEvents

  const activeQuery = React.useMemo(() => {
    return allQueries.find(query => query.queryHash === activeQueryHash)
  }, [activeQueryHash, allQueries])

  const queries = React.useMemo(() => {
    if (!filter) return allQueries
    return matchSorter(allQueries, filter, { keys: ['queryHash'] })
  }, [filter, allQueries])

  return (
    <ThemeProvider theme={theme}>
      <Panel
        ref={ref}
        className="ReactQueryDevtoolsPanel"
        aria-label="React Query Devtools Panel"
        id="ReactQueryDevtoolsPanel"
        {...panelProps}
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
        <div
          style={{
            flex: '1 1 500px',
            minHeight: '40%',
            maxHeight: '100%',
            overflow: 'auto',
            borderRight: `1px solid ${theme.grayAlt}`,
            display: isOpen ? 'flex' : 'none',
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
                  alignItems: 'center',
                }}
              >
                <Input
                  placeholder="Filter"
                  aria-label="Filter by queryhash"
                  value={filter ?? ''}
                  onChange={e => setFilter(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Escape') setFilter('')
                  }}
                  style={{
                    flex: '1',
                    marginRight: '.5em',
                    width: '100%',
                  }}
                />
              </div>
            </div>
          </div>
          <div
            style={{
              overflowY: 'auto',
              flex: '1',
            }}
          >
            {queries.map((query, i) => {
              return (
                <div
                  key={query.queryHash || i}
                  role="button"
                  aria-label={`Open query details for ${query.queryHash}`}
                  onClick={() =>
                    setActiveQueryHash(
                      activeQueryHash === query.queryHash ? '' : query.queryHash
                    )
                  }
                  style={{
                    display: 'flex',
                    borderBottom: `solid 1px ${theme.grayAlt}`,
                    cursor: 'pointer',
                    background:
                      query === activeQuery
                        ? 'rgba(255,255,255,.1)'
                        : undefined,
                  }}
                >
                  <Code
                    style={{
                      padding: '.5em',
                      width: 200,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    }}
                  >
                    {`${query.queryHash}`}
                  </Code>
                  <div style={{ padding: '4px 8px', flex: 1, height: 30 }}>
                    {timeRange?.start ? (
                      <ReactQueryDevtoolsQueryBox
                        query={query}
                        timeRange={
                          timeRange as { start: Date; end: Date | null }
                        }
                      />
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Panel>
    </ThemeProvider>
  )
})

export default ReactQueryDevtoolsPanel
