import { ContextOptions } from '@tanstack/react-query'
import { rankItem } from '@tanstack/match-sorter-utils'
import * as React from 'react'
import { PanelHead, PanelMain } from '../panelComponents'
import { Code, Input } from '../styledComponents'
import { DevtoolsPanel } from '../types'
import useLocalStorage from '../useLocalStorage'
import useTimelineEvents from './useTimelineEvents'
import { SVGQueryTimeline, TooltipOptions } from './timelineComponents'
import { useTheme } from '../theme'
import TimelineOptions from './timelineOptions'

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
const TableQueryRowHeight = 38

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
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const { start, end } = timeRange
    if (!start) return
    const horizontalOffset = e.clientX - isDragging.start

    const timelineEnd = end ? end.getTime() : new Date().getTime()
    const totalWidth = timelineEnd - start.getTime()
    const scaledTotalWidth = totalWidth / zoom
    const clampedOffset = clampValue(
      horizontalOffset,
      -scaledTotalWidth,
      scaledTotalWidth,
    )
    setOffset(clampedOffset)
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

  const [tooltip, setTooltip] = React.useState<TooltipOptions | null>(null)

  return (
    <>
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            top: tooltip.y,
            left: tooltip.x,
            backgroundColor: theme.background,
          }}
        >
          {tooltip.content}
        </div>
      )}
      <PanelMain isOpen={isOpen}>
        <PanelHead {...headProps}>
          <TimelineOptions
            timelineEvents={timelineEvents}
            filter={filter}
            setFilter={setFilter}
            zoom={zoom}
            setZoom={setZoom}
            onStartRecording={() => {
              setOffset(0)
              setZoom(200)
            }}
          />
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
              <div style={{ display: 'flex', flexFlow: 'row' }}>
                <div style={{ width: TableQueryKeyWidth }}>
                  {queries.map((query, i) => {
                    return (
                      <div
                        key={query.queryHash || i}
                        style={{
                          display: 'flex',
                          borderBottom: `solid 1px ${theme.grayAlt}`,
                          boxSizing: 'border-box',
                          cursor: 'pointer',
                          alignItems: 'center',
                          height: TableQueryRowHeight,
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
                      </div>
                    )
                  })}
                </div>
                <div
                  style={{ flex: 1, cursor: 'pointer', overflow: 'hidden' }}
                  onMouseDown={(e) => {
                    setIsDragging({
                      start: e.clientX - offset,
                    })
                  }}
                  onMouseMove={onMouseMove}
                  onMouseUp={() => {
                    setIsDragging(null)
                  }}
                >
                  {queries.map((query, i) => {
                    if (!timeRange.start) return null

                    return (
                      <SVGQueryTimeline
                        key={query.queryHash || i}
                        ref={i === 0 ? containerRef : undefined}
                        query={query}
                        timeRange={
                          timeRange as { start: Date; end: Date | null }
                        }
                        zoom={zoom}
                        offset={offset}
                        setTooltip={setTooltip}
                      />
                    )
                  })}
                </div>
              </div>
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
    </>
  )
}
