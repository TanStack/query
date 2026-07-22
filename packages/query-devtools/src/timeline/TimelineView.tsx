import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
} from 'solid-js'
import { clsx as cx } from 'clsx'
import * as goober from 'goober'
import { tokens } from '../theme'
import { useQueryDevtoolsContext, useTheme } from '../contexts'
import { Trash } from '../icons'
import {
  clearTimeline,
  formatDuration,
  useTimelineSpans,
} from './timelineStore'
import { TimelineRow } from './TimelineRow'
import type { TimelineFilter, TimelineSpan } from './types'
import type { Component } from 'solid-js'

const MIN_WINDOW_MS = 1000

export const TimelineView: Component = () => {
  const theme = useTheme()
  const css = useQueryDevtoolsContext().shadowDOMTarget
    ? goober.css.bind({ target: useQueryDevtoolsContext().shadowDOMTarget })
    : goober.css

  const styles = createMemo(() => {
    const isDark = theme() === 'dark'
    const colors = tokens.colors
    const t = (light: string, dark: string) => (isDark ? dark : light)

    return {
      root: css`
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        overflow: hidden;
      `,
      toolbar: css`
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: ${tokens.size[2]};
        padding: ${tokens.size[1.5]} ${tokens.size[2]};
        border-bottom: 1px solid
          ${t(colors.gray[200], colors.darkGray[500])};
        flex-shrink: 0;
      `,
      filters: css`
        display: flex;
        gap: ${tokens.size[1]};
      `,
      filterBtn: css`
        border: 1px solid ${t(colors.gray[300], colors.darkGray[300])};
        background: ${t(colors.gray[50], colors.darkGray[700])};
        color: ${t(colors.gray[700], colors.gray[300])};
        border-radius: ${tokens.border.radius.sm};
        font-size: ${tokens.font.size.xs};
        padding: 2px ${tokens.size[2]};
        cursor: pointer;

        &[data-active='true'] {
          background: ${t(colors.blue[50], colors.blue[900])};
          border-color: ${t(colors.blue[300], colors.blue[700])};
          color: ${t(colors.blue[700], colors.blue[200])};
        }
      `,
      clearBtn: css`
        display: inline-flex;
        align-items: center;
        gap: ${tokens.size[1]};
        border: 1px solid ${t(colors.gray[300], colors.darkGray[300])};
        background: transparent;
        color: ${t(colors.gray[700], colors.gray[300])};
        border-radius: ${tokens.border.radius.sm};
        font-size: ${tokens.font.size.xs};
        padding: 2px ${tokens.size[2]};
        cursor: pointer;

        & svg {
          width: ${tokens.size[3]};
          height: ${tokens.size[3]};
        }

        &:hover {
          background: ${t(colors.gray[100], colors.darkGray[600])};
        }
      `,
      list: css`
        flex: 1;
        min-height: 0;
        overflow: auto;
      `,
      empty: css`
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: ${tokens.size[4]};
        color: ${t(colors.gray[500], colors.gray[400])};
        font-size: ${tokens.font.size.sm};
        text-align: center;
      `,
      details: css`
        flex-shrink: 0;
        border-top: 1px solid ${t(colors.gray[200], colors.darkGray[500])};
        padding: ${tokens.size[2]};
        font-size: ${tokens.font.size.xs};
        color: ${t(colors.gray[800], colors.gray[200])};
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: ${tokens.size[1]} ${tokens.size[3]};
      `,
      detailLabel: css`
        color: ${t(colors.gray[500], colors.gray[400])};
        margin-right: ${tokens.size[1]};
      `,
      detailValue: css`
        font-family: 'Fira Code', monospace;
        word-break: break-all;
      `,
    }
  })

  const allSpans = useTimelineSpans()
  const [filter, setFilter] = createSignal<TimelineFilter>('all')
  const [selectedId, setSelectedId] = createSignal<string | null>(null)
  const [now, setNow] = createSignal(Date.now())

  const filteredSpans = createMemo(() => {
    const f = filter()
    const list = allSpans()
    if (f === 'all') return list
    return list.filter((s) => s.kind === f)
  })

  const hasPending = createMemo(() =>
    filteredSpans().some(
      (s) => s.status === 'pending' || s.status === 'paused',
    ),
  )

  createEffect(() => {
    if (!hasPending()) return
    const id = window.setInterval(() => setNow(Date.now()), 50)
    onCleanup(() => window.clearInterval(id))
  })

  // Keep `now` fresh when new spans arrive even if none pending yet
  createEffect(() => {
    allSpans()
    setNow(Date.now())
  })

  const windowBounds = createMemo(() => {
    const list = filteredSpans()
    const currentNow = now()
    if (!list.length) {
      return { start: currentNow - MIN_WINDOW_MS, duration: MIN_WINDOW_MS }
    }
    let start = Infinity
    let end = -Infinity
    for (const span of list) {
      start = Math.min(start, span.startedAt)
      const spanEnd =
        span.endedAt ??
        (span.status === 'pending' || span.status === 'paused'
          ? currentNow
          : span.startedAt)
      end = Math.max(end, spanEnd)
    }
    const duration = Math.max(MIN_WINDOW_MS, end - start)
    const pad = duration * 0.05
    return { start: start - pad, duration: duration + pad * 2 }
  })

  const selectedSpan = createMemo(() => {
    const id = selectedId()
    if (!id) return undefined
    return allSpans().find((s) => s.id === id)
  })

  const toggleSelect = (span: TimelineSpan) => {
    setSelectedId((prev) => (prev === span.id ? null : span.id))
  }

  return (
    <div class={cx(styles().root, 'tsqd-timeline-container')}>
      <div class={cx(styles().toolbar, 'tsqd-timeline-toolbar')}>
        <div class={styles().filters} role="group" aria-label="Filter timeline">
          {(
            [
              ['all', 'All'],
              ['query', 'Queries'],
              ['mutation', 'Mutations'],
            ] as const
          ).map(([value, label]) => (
            <button
              type="button"
              class={styles().filterBtn}
              data-active={filter() === value}
              aria-pressed={filter() === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          class={cx(styles().clearBtn, 'tsqd-timeline-clear')}
          aria-label="Clear timeline"
          title="Clear timeline"
          onClick={() => {
            clearTimeline()
            setSelectedId(null)
          }}
        >
          <Trash />
          Clear
        </button>
      </div>

      <div class={cx(styles().list, 'tsqd-timeline-list')}>
        <Show
          when={filteredSpans().length > 0}
          fallback={
            <div class={styles().empty}>
              No query or mutation fetches recorded yet. Run requests to see the
              waterfall.
            </div>
          }
        >
          <For each={filteredSpans()}>
            {(span) => (
              <TimelineRow
                span={span}
                windowStart={windowBounds().start}
                windowDuration={windowBounds().duration}
                now={now()}
                selected={selectedId() === span.id}
                onSelect={() => toggleSelect(span)}
              />
            )}
          </For>
        </Show>
      </div>

      <Show when={selectedSpan()}>
        {(span) => (
          <div class={cx(styles().details, 'tsqd-timeline-details')}>
            <div>
              <span class={styles().detailLabel}>Kind</span>
              <span class={styles().detailValue}>{span().kind}</span>
            </div>
            <div>
              <span class={styles().detailLabel}>Status</span>
              <span class={styles().detailValue}>{span().status}</span>
            </div>
            <div style={{ 'grid-column': '1 / -1' }}>
              <span class={styles().detailLabel}>Key</span>
              <span class={styles().detailValue}>{span().keyLabel}</span>
            </div>
            <div>
              <span class={styles().detailLabel}>Started</span>
              <span class={styles().detailValue}>
                {new Date(span().startedAt).toLocaleTimeString()}
              </span>
            </div>
            <div>
              <span class={styles().detailLabel}>Duration</span>
              <span class={styles().detailValue}>
                {span().durationMs !== undefined
                  ? formatDuration(span().durationMs)
                  : formatDuration(Math.max(0, now() - span().startedAt))}
              </span>
            </div>
          </div>
        )}
      </Show>
    </div>
  )
}
