import { ContextOptions } from '@tanstack/react-query'
import * as React from 'react'
import { PanelHead, PanelMain } from '../panelComponents'
import { Button, Input } from '../styledComponents'
import { DevtoolsPanel } from '../types'
import useLocalStorage from '../useLocalStorage'

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

export function TimelinePanel(props: TimelinePanelProps) {
  const { isOpen = true, context, ...headProps } = props

  const [filter, setFilter] = useLocalStorage('reactQueryDevtoolsFilter', '')

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
            >
              <svg width="16" height="16" viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="8" fill="red" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Clear"
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
        }}
      ></div>
    </PanelMain>
  )
}
