import { ContextOptions } from '@tanstack/react-query'
import { rankItem } from '@tanstack/match-sorter-utils'
import * as React from 'react'
import { PanelHead, PanelMain } from '../panelComponents'
import { Code, Input } from '../styledComponents'
import { DevtoolsPanel } from '../types'
import useLocalStorage from '../useLocalStorage'
import useTimelineEvents from './useTimelineEvents'
import { SVGQueryTimeline } from './timelineComponents'
import { useTheme } from '../theme'

function clampValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

interface TimelinePanelProps extends ContextOptions {
  /**
   * A boolean variable indicating whether the panel is open or closed
   */
  isOpen?: boolean
  /**
   * A function that toggles the open and close state of the panel
   */
  setIsOpen: (isOpen: boolean) => void
  /**
   * Current active panel
   */
  panel: DevtoolsPanel
  /**
   * Function that update active panel
   */
  setPanel: (panel: DevtoolsPanel) => void
}

const TableQueryKeyWidth = 200

function convertTickPositionToDate(
  tickPosition: number,
  {
    zoom,
    offset,
    timeRange,
  }: {
    zoom: number
    offset: number
    timeRange: { start: Date | null; end: Date | null }
  },
): Date | null {
  const { start, end } = timeRange
  if (!start) return null
  const currentTimePosition = offset * zoom + tickPosition * zoom

  const tickDate = new Date(start.getTime() + currentTimePosition)
  if (tickDate.getTime() > (end || new Date()).getTime()) return null
  return tickDate
}
function printTime(date: Date) {
  const pad = (n: number, width: number) => String(n).padStart(width, '0')
  const hours = pad(date.getHours(), 2)
  const minutes = pad(date.getMinutes(), 2)
  const seconds = pad(date.getSeconds(), 2)
  const milliseconds = pad(date.getMilliseconds(), 3)
  return `${hours}:${minutes}:${seconds}.${milliseconds}`
}

export function TimelinePanel(props: TimelinePanelProps) {
  const { isOpen = true, context, ...headProps } = props
  const theme = useTheme()
  const containerRef = React.useRef<HTMLDivElement>(null)

  const timelineEvents = useTimelineEvents({ context })

  const [filter, setFilter] = useLocalStorage('reactQueryDevtoolsFilter', '')

  const { queries: allQueries, timeRange } = timelineEvents

  const queries = React.useMemo(() => {
    if (!filter) return allQueries

    const ranked = allQueries.map(
      (item) => [item, rankItem(item.queryHash, filter)] as const,
    )

    return ranked.filter((d) => d[1].passed).map((x) => x[0])
  }, [filter, allQueries])

  // const width = useElementWidth(containerRef)

  // Zoom: ms by pixel
  const [zoom, setZoom] = React.useState(200)
  // Offset: pixel
  const [offset, setOffset] = React.useState(0)
  const [isDragging, setIsDragging] = React.useState<{ start: number } | null>(
    null,
  )
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation()
    e.preventDefault()
    setZoom((x) => clampValue(x + e.deltaY * 10, 10, 10000))
    return false
  }
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const { start, end } = timeRange
    if (!start) return
    setOffset(
      clampValue(
        -(e.clientX - isDragging.start) * zoom,
        0,
        ((end || new Date()).getTime() - start.getTime()) / zoom,
      ),
    )
  }
  const [tickPosition, setTickPosition] = React.useState(0)
  const tickOffset = TableQueryKeyWidth + 8
  const moveTick = (e: React.MouseEvent<HTMLDivElement>) => {
    setTickPosition(Math.max(tickOffset, e.clientX))
  }

  const tickDate = timeRange.start
    ? convertTickPositionToDate(tickPosition - tickOffset, {
        zoom,
        offset,
        timeRange,
      })
    : null

  return (
    <PanelMain isOpen={isOpen}>
      <PanelHead {...headProps}>
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
              marginTop: 2,
              marginBottom: 4,
            }}
          >
            <button
              type="button"
              aria-label="Start recording"
              style={{
                background: 'none',
                border: 0,
                cursor: 'pointer',
                marginLeft: -6,
              }}
              onClick={() => {
                if (timelineEvents.isRecording) {
                  timelineEvents.stopRecording()
                } else {
                  timelineEvents.startRecording()
                }
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16">
                <circle
                  cx="8"
                  cy="8"
                  r="8"
                  fill={timelineEvents.isRecording ? 'red' : 'white'}
                />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Clear"
              onClick={() => timelineEvents.clear()}
              style={{
                background: 'none',
                border: 0,
                cursor: 'pointer',
                marginLeft: -6,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16">
                <circle
                  cx="8"
                  cy="8"
                  r="7"
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                />
                <path d="M13,3 L3,13" stroke="white" strokeWidth="2" />
              </svg>
            </button>
          </div>
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
              onChange={(e) => setFilter(e.target.value)}
              onKeyDown={(e) => {
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
      </PanelHead>
      <div
        style={{
          overflowY: 'auto',
          flex: '1',
          position: 'relative',
        }}
        onMouseMove={moveTick}
      >
        {queries.length > 0 ? (
          <>
            {tickDate && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  backgroundColor: theme.grayAlt,
                  padding: '0.5em',
                }}
              >
                {printTime(tickDate)}
              </div>
            )}
            <div
              style={{
                position: 'absolute',
                left: tickPosition - 1,
                top: 0,
                height: '100%',
                width: '1px',
                pointerEvents: 'none',
                background: theme.foreground,
                display: 'none',
              }}
            ></div>
            {queries.map((query, i) => {
              return (
                <div
                  key={query.queryHash || i}
                  role="button"
                  aria-label={`Open query details for ${query.queryHash}`}
                  style={{
                    display: 'flex',
                    borderBottom: `solid 1px ${theme.grayAlt}`,
                    cursor: 'pointer',
                    alignItems: 'center',
                  }}
                >
                  <Code
                    style={{
                      padding: '.5em',
                      boxSizing: 'border-box',
                      width: TableQueryKeyWidth,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      borderRight: `solid 1px ${theme.grayAlt}`,
                    }}
                  >
                    {`${query.queryHash}`}
                  </Code>
                  {timeRange.start ? (
                    <SVGQueryTimeline
                      ref={i === 0 ? containerRef : undefined}
                      query={query}
                      timeRange={timeRange as { start: Date; end: Date | null }}
                      onWheel={onWheel}
                      onMouseDown={(e) =>
                        setIsDragging({
                          start: e.clientX,
                        })
                      }
                      onMouseMove={onMouseMove}
                      onMouseUp={() => setIsDragging(null)}
                      zoom={zoom}
                      offset={offset}
                    />
                  ) : null}
                </div>
              )
            })}
          </>
        ) : (
          <div
            style={{
              padding: '1em',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '1.3em',
              textAlign: 'center',
              opacity: 0.4,
              height: '100%',
            }}
          >
            {timelineEvents.isRecording ? (
              <p>
                Recording...
                <br />
                <br />
                Navigate to a component that use a query to display the
                timeline.
              </p>
            ) : (
              <p>
                No queries recorded yet.
                <br />
                <br />
                To start recording, click the circle in the top right.
              </p>
            )}
          </div>
        )}
      </div>
    </PanelMain>
  )
}
