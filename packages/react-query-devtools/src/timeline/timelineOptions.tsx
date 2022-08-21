import * as React from 'react'
import { Input } from '../styledComponents'
import useTimelineEvents from './useTimelineEvents'

function clampValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

const zoomBasis = 200 // ms per pixel
function clampZoom(zoom: number) {
  return clampValue(zoom, 10, 10000)
}

export default function TimelineOptions({
  timelineEvents,
  filter,
  setFilter,
  zoom,
  setZoom,
  onStartRecording,
}: {
  timelineEvents: ReturnType<typeof useTimelineEvents>
  filter: string | undefined
  setFilter: React.Dispatch<React.SetStateAction<string>>
  zoom: number
  setZoom: React.Dispatch<React.SetStateAction<number>>
  onStartRecording: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <div
        style={{
          alignSelf: 'flex-end',
        }}
      >
        <button onClick={() => setZoom((z) => clampZoom(z * 1.5))}>-</button>
        {Math.floor((zoomBasis / zoom) * 100)}%
        <button onClick={() => setZoom((z) => clampZoom(z / 1.5))}>+</button>
      </div>
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
                onStartRecording()
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
    </div>
  )
}
