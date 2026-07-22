import { createMemo } from 'solid-js'
import { clsx as cx } from 'clsx'
import * as goober from 'goober'
import { tokens } from '../theme'
import { useQueryDevtoolsContext, useTheme } from '../contexts'
import { formatDuration } from './timelineStore'
import type { TimelineSpan } from './types'
import type { Component } from 'solid-js'

const statusColor = (
  status: TimelineSpan['status'],
): 'blue' | 'green' | 'red' | 'purple' => {
  switch (status) {
    case 'success':
      return 'green'
    case 'error':
      return 'red'
    case 'paused':
      return 'purple'
    case 'pending':
    default:
      return 'blue'
  }
}

export const TimelineRow: Component<{
  span: TimelineSpan
  windowStart: number
  windowDuration: number
  now: number
  selected: boolean
  onSelect: () => void
}> = (props) => {
  const theme = useTheme()
  const css = useQueryDevtoolsContext().shadowDOMTarget
    ? goober.css.bind({ target: useQueryDevtoolsContext().shadowDOMTarget })
    : goober.css

  const styles = createMemo(() => {
    const isDark = theme() === 'dark'
    const colors = tokens.colors
    const t = (light: string, dark: string) => (isDark ? dark : light)

    return {
      row: css`
        display: grid;
        grid-template-columns: minmax(140px, 28%) 72px 1fr;
        gap: ${tokens.size[2]};
        align-items: center;
        width: 100%;
        padding: ${tokens.size[1]} ${tokens.size[2]};
        border: none;
        border-bottom: 1px solid
          ${t(colors.gray[200], colors.darkGray[500])};
        background: transparent;
        color: ${t(colors.gray[800], colors.gray[200])};
        font-size: ${tokens.font.size.xs};
        text-align: left;
        cursor: pointer;

        &:hover {
          background-color: ${t(colors.gray[50], colors.darkGray[700])};
        }
      `,
      selected: css`
        background-color: ${t(colors.blue[50], colors.darkGray[600])} !important;
      `,
      label: css`
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      `,
      kind: css`
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: ${t(colors.gray[500], colors.gray[400])};
      `,
      key: css`
        font-family: 'Fira Code', monospace;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      `,
      duration: css`
        font-variant-numeric: tabular-nums;
        color: ${t(colors.gray[600], colors.gray[300])};
        text-align: right;
      `,
      track: css`
        position: relative;
        height: ${tokens.size[4]};
        border-radius: ${tokens.border.radius.sm};
        background-color: ${t(colors.gray[100], colors.darkGray[800])};
        overflow: hidden;
      `,
      bar: css`
        position: absolute;
        top: 2px;
        bottom: 2px;
        min-width: 2px;
        border-radius: ${tokens.border.radius.xs};
      `,
    }
  })

  const color = () => statusColor(props.span.status)

  const barStyle = () => {
    const end =
      props.span.endedAt ??
      (props.span.status === 'pending' || props.span.status === 'paused'
        ? props.now
        : props.span.startedAt)
    const leftPct =
      ((props.span.startedAt - props.windowStart) / props.windowDuration) * 100
    const widthPct = ((end - props.span.startedAt) / props.windowDuration) * 100
    const colors = tokens.colors
    const shade = theme() === 'dark' ? 500 : 500
    return {
      left: `${Math.max(0, leftPct)}%`,
      width: `${Math.max(0.3, Math.min(100, widthPct))}%`,
      'background-color': colors[color()][shade],
    }
  }

  const durationLabel = () => {
    if (props.span.durationMs !== undefined) {
      return formatDuration(props.span.durationMs)
    }
    if (props.span.status === 'pending' || props.span.status === 'paused') {
      return formatDuration(Math.max(0, props.now - props.span.startedAt))
    }
    return '—'
  }

  return (
    <button
      type="button"
      class={cx(
        styles().row,
        props.selected && styles().selected,
        'tsqd-timeline-row',
      )}
      aria-label={`${props.span.kind} ${props.span.keyLabel}, ${props.span.status}, ${durationLabel()}`}
      aria-pressed={props.selected}
      onClick={props.onSelect}
    >
      <div class={styles().label}>
        <span class={styles().kind}>{props.span.kind}</span>
        <code class={cx(styles().key, 'tsqd-timeline-key')}>
          {props.span.keyLabel}
        </code>
      </div>
      <span class={cx(styles().duration, 'tsqd-timeline-duration')}>
        {durationLabel()}
      </span>
      <div class={cx(styles().track, 'tsqd-timeline-track')}>
        <div class={cx(styles().bar, 'tsqd-timeline-bar')} style={barStyle()} />
      </div>
    </button>
  )
}
