import React from 'react'

import {
  ReactQueryDevtoolsQueryEventGroup,
  ReactQueryQueryEvent,
} from './useTimelineEvents'

import { computeObserverCountBoxes, computeQueryBoxes } from './utils'

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

interface SVGQueryTimelineProps extends React.ComponentProps<'div'> {
  query: ReactQueryDevtoolsQueryEventGroup
  timeRange: { start: Date; end: Date | null }
  zoom: number
  offset: number
}

export const SVGQueryTimeline = React.forwardRef<
  HTMLDivElement,
  SVGQueryTimelineProps
>(function SVGQueryTimeline(props, ref) {
  const { query, timeRange, zoom, offset, ...divProps } = props
  const boxes = React.useMemo(() => {
    return computeQueryBoxes(query, timeRange)
  }, [query, timeRange])

  const scaleX = (x: Date) => {
    const translatedX = x.getTime() - timeRange.start.getTime()
    return translatedX / zoom
  }

  return (
    <div
      ref={ref}
      {...divProps}
      style={{ height: 30, padding: '4px 8px', flex: 1, overflow: 'hidden' }}
    >
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`${-2 + offset} -2 100 10`}
        preserveAspectRatio="xMinYMid meet"
      >
        {boxes.map((item) => {
          const counts = computeObserverCountBoxes(item)

          return (
            <g key={item.startAt.getTime()}>
              <rect
                x={scaleX(item.startAt)}
                y="0"
                width={scaleX(item.endAt) - scaleX(item.startAt)}
                height="7"
                fill="#8798bf42"
              >
                Cache time: {item.cacheTime}ms
              </rect>
              {counts.map((count) => (
                <React.Fragment key={count.start.getTime()}>
                  <rect
                    key={count.start.getTime()}
                    x={scaleX(count.start)}
                    y="0"
                    width={scaleX(count.end) - scaleX(count.start)}
                    height="7"
                    fill="#375c8d"
                  >
                    <title>{count.count} observer(s)</title>
                  </rect>
                  <text
                    x={(scaleX(count.start) + scaleX(count.end)) / 2}
                    y="5"
                    fill="white"
                    fontSize="4"
                  >
                    {count.count}
                  </text>
                </React.Fragment>
              ))}
              {item.updates.map((update, i) => (
                <React.Fragment key={i}>
                  <circle
                    cx={scaleX(update.at)}
                    cy="0"
                    r="2"
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
          )
        })}
      </svg>
    </div>
  )
})
