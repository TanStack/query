import type { Accessor, Component, JSX, Setter } from 'solid-js'
import {
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'
import { rankItem } from '@tanstack/match-sorter-utils'
import { css, cx } from '@emotion/css'
import { tokens } from './theme'
import type { Query, QueryCache, QueryState } from '@tanstack/query-core'
import {
  getQueryStatusLabel,
  getQueryStatusColor,
  displayValue,
  getQueryStatusColorByLabel,
  sortFns,
  convertRemToPixels,
} from './utils'
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Offline,
  Search,
  Settings,
  TanstackLogo,
  Wifi,
} from './icons'
import Explorer from './Explorer'
import type {
  QueryDevtoolsProps,
  DevtoolsPosition,
  DevtoolsButtonPosition,
} from './Context'
import { QueryDevtoolsContext, useQueryDevtoolsContext } from './Context'
import { TransitionGroup } from 'solid-transition-group'
import { loadFonts } from './fonts'
import { Key } from '@solid-primitives/keyed'
import type { StorageObject, StorageSetter } from '@solid-primitives/storage'
import { createLocalStorage } from '@solid-primitives/storage'
import { createResizeObserver } from '@solid-primitives/resize-observer'

interface DevToolsErrorType {
  /**
   * The name of the error.
   */
  name: string
  /**
   * How the error is initialized.
   */
  initializer: (query: Query) => Error
}

interface DevtoolsPanelProps {
  localStore: StorageObject<string>
  setLocalStore: StorageSetter<string, unknown>
}

interface QueryStatusProps {
  label: string
  color: 'green' | 'yellow' | 'gray' | 'blue' | 'purple'
  count: number
}

const firstBreakpoint = 1024
const secondBreakpoint = 796
const thirdBreakpoint = 700

const BUTTON_POSITION: DevtoolsButtonPosition = 'bottom-right'
const POSITION: DevtoolsPosition = 'bottom'
const INITIAL_IS_OPEN = false
const DEFAULT_HEIGHT = 500
const DEFAULT_WIDTH = 500
const DEFAULT_SORT_FN_NAME = Object.keys(sortFns)[0]
const DEFAULT_SORT_ORDER = 1

const [selectedQueryHash, setSelectedQueryHash] = createSignal<string | null>(
  null,
)
const [panelWidth, setPanelWidth] = createSignal(0)

export const DevtoolsComponent: Component<QueryDevtoolsProps> = (props) => {
  return (
    <QueryDevtoolsContext.Provider value={props}>
      <Devtools />
    </QueryDevtoolsContext.Provider>
  )
}

export const Devtools = () => {
  loadFonts()

  const styles = getStyles()

  const [localStore, setLocalStore] = createLocalStorage({
    prefix: 'TanstackQueryDevtools',
  })

  const buttonPosition = createMemo(() => {
    return useQueryDevtoolsContext().buttonPosition || BUTTON_POSITION
  })

  const isOpen = createMemo(() => {
    return (
      localStore.open === 'true' ||
      useQueryDevtoolsContext().initialIsOpen ||
      INITIAL_IS_OPEN
    )
  })

  const position = createMemo(() => {
    return localStore.position || useQueryDevtoolsContext().position || POSITION
  })

  return (
    <div
      class={css`
        & .TSQD-panel-exit-active,
        & .TSQD-panel-enter-active {
          transition: opacity 0.3s, transform 0.3s;
        }

        & .TSQD-panel-exit-to,
        & .TSQD-panel-enter {
          ${position() === 'top'
            ? `transform: translateY(-${Number(
                localStore.height || DEFAULT_HEIGHT,
              )}px);`
            : position() === 'left'
            ? `transform: translateX(-${Number(
                localStore.width || DEFAULT_WIDTH,
              )}px);`
            : position() === 'right'
            ? `transform: translateX(${Number(
                localStore.width || DEFAULT_WIDTH,
              )}px);`
            : `transform: translateY(${Number(
                localStore.height || DEFAULT_HEIGHT,
              )}px);`}
        }

        & .TSQD-button-exit-active,
        & .TSQD-button-enter-active {
          transition: opacity 0.3s, transform 0.3s;
        }

        & .TSQD-button-exit-to,
        & .TSQD-button-enter {
          transform: ${buttonPosition() === 'top-left'
            ? `translateX(-72px);`
            : buttonPosition() === 'top-right'
            ? `translateX(72px);`
            : `translateY(72px);`};
        }
      `}
    >
      <TransitionGroup name="TSQD-panel">
        <Show when={isOpen()}>
          <DevtoolsPanel
            localStore={localStore}
            setLocalStore={setLocalStore}
          />
        </Show>
      </TransitionGroup>
      <TransitionGroup name="TSQD-button">
        <Show when={!isOpen()}>
          <div
            class={cx(
              styles.devtoolsBtn,
              styles[`devtoolsBtn-position-${buttonPosition()}`],
            )}
          >
            <div>
              <TanstackLogo />
            </div>
            <button onClick={() => setLocalStore('open', 'true')}>
              <TanstackLogo />
            </button>
          </div>
        </Show>
      </TransitionGroup>
    </div>
  )
}

export const DevtoolsPanel: Component<DevtoolsPanelProps> = (props) => {
  const styles = getStyles()
  const [isResizing, setIsResizing] = createSignal(false)

  const sort = createMemo(() => props.localStore.sort || DEFAULT_SORT_FN_NAME)
  const sortOrder = createMemo(
    () => Number(props.localStore.sortOrder) || DEFAULT_SORT_ORDER,
  ) as () => 1 | -1

  const [offline, setOffline] = createSignal(false)
  const [settingsOpen, setSettingsOpen] = createSignal(false)

  const position = createMemo(
    () =>
      (props.localStore.position ||
        useQueryDevtoolsContext().position ||
        POSITION) as DevtoolsPosition,
  )

  const sortFn = createMemo(() => sortFns[sort() as string])

  const onlineManager = createMemo(
    () => useQueryDevtoolsContext().onlineManager,
  )

  const cache = createMemo(() => {
    return useQueryDevtoolsContext().client.getQueryCache()
  })

  const queryCount = createSubscribeToQueryCacheBatcher((queryCache) => {
    return queryCache().getAll().length
  }, false)

  const queries = createMemo(
    on(
      () => [queryCount(), props.localStore.filter, sort(), sortOrder()],
      () => {
        const curr = cache().getAll()

        const filtered = props.localStore.filter
          ? curr.filter(
              (item) =>
                rankItem(item.queryHash, props.localStore.filter || '').passed,
            )
          : [...curr]

        const sorted = sortFn()
          ? filtered.sort((a, b) => sortFn()!(a, b) * sortOrder())
          : filtered
        return sorted
      },
    ),
  )

  const handleDragStart: JSX.EventHandler<HTMLDivElement, MouseEvent> = (
    event,
  ) => {
    const panelElement = event.currentTarget.parentElement
    if (!panelElement) return
    setIsResizing(true)
    const { height, width } = panelElement.getBoundingClientRect()
    const startX = event.clientX
    const startY = event.clientY
    let newSize = 0
    const minHeight = convertRemToPixels(3.5)
    const minWidth = convertRemToPixels(12)
    const runDrag = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault()

      if (position() === 'left' || position() === 'right') {
        const valToAdd =
          position() === 'right'
            ? startX - moveEvent.clientX
            : moveEvent.clientX - startX
        newSize = Math.round(width + valToAdd)
        if (newSize < minWidth) {
          newSize = minWidth
        }
        props.setLocalStore('width', String(Math.round(newSize)))

        const newWidth = panelElement.getBoundingClientRect().width
        if (Number(props.localStore.width) < newWidth) {
          props.setLocalStore('width', String(newWidth))
        }
      } else {
        const valToAdd =
          position() === 'bottom'
            ? startY - moveEvent.clientY
            : moveEvent.clientY - startY
        newSize = Math.round(height + valToAdd)
        if (newSize < minHeight) {
          newSize = minHeight
          setSelectedQueryHash(null)
        }
        props.setLocalStore('height', String(Math.round(newSize)))
      }
    }

    const unsub = () => {
      if (isResizing()) {
        setIsResizing(false)
      }
      document.removeEventListener('mousemove', runDrag, false)
      document.removeEventListener('mouseUp', unsub, false)
    }

    document.addEventListener('mousemove', runDrag, false)
    document.addEventListener('mouseup', unsub, false)
  }

  setupQueryCacheSubscription()

  let queriesContainerRef!: HTMLDivElement
  let panelRef!: HTMLDivElement

  onMount(() => {
    createResizeObserver(panelRef, ({ width }, el) => {
      if (el === panelRef) {
        setPanelWidth(width)
      }
    })
  })

  const setDevtoolsPosition = (pos: DevtoolsPosition) => {
    props.setLocalStore('position', pos)
    setSettingsOpen(false)
  }

  return (
    <aside
      class={`${styles.panel} ${styles[`panel-position-${position()}`]} 
        ${css`
          flex-direction: ${panelWidth() < secondBreakpoint ? 'column' : 'row'};
          background-color: ${panelWidth() < secondBreakpoint
            ? tokens.colors.gray[600]
            : tokens.colors.darkGray[900]};
          ${panelWidth() < thirdBreakpoint &&
          (position() === 'right' || position() === 'left')
            ? `
            min-width: min-content;
          `
            : ''}
        `} 
      `}
      style={{
        height:
          position() === 'bottom' || position() === 'top'
            ? `${props.localStore.height || DEFAULT_HEIGHT}px`
            : 'auto',
        width:
          position() === 'right' || position() === 'left'
            ? `${props.localStore.width || DEFAULT_WIDTH}px`
            : 'auto',
      }}
      ref={panelRef}
      aria-label="Tanstack query devtools"
    >
      <div
        class={cx(
          styles.dragHandle,
          styles[`dragHandle-position-${position()}`],
        )}
        onMouseDown={handleDragStart}
      ></div>
      <div
        ref={queriesContainerRef}
        class={`${styles.queriesContainer} ${css`
          ${panelWidth() < secondBreakpoint && selectedQueryHash()
            ? `
          height: 50%;
          max-height: 50%;
          `
            : ''}
        `}`}
      >
        <div class={cx(styles.row)}>
          <button
            class={styles.logo}
            onClick={() => props.setLocalStore('open', 'false')}
            aria-label="Close Tanstack query devtools"
          >
            <span class={styles.tanstackLogo}>TANSTACK</span>
            <span class={styles.queryFlavorLogo}>
              {useQueryDevtoolsContext().queryFlavor} v
              {useQueryDevtoolsContext().version}
            </span>
          </button>
          <QueryStatusCount />
        </div>
        <div
          class={cx(
            styles.row,
            css`
              gap: ${tokens.size[2.5]};
            `,
          )}
        >
          <div class={styles.filtersContainer}>
            <div class={styles.filterInput}>
              <Search />
              <input
                aria-label="Filter queries by query key"
                type="text"
                placeholder="Filter"
                onInput={(e) =>
                  props.setLocalStore('filter', e.currentTarget.value)
                }
                value={props.localStore.filter || ''}
              />
            </div>
            <div class={styles.filterSelect}>
              <select
                value={sort()}
                onChange={(e) =>
                  props.setLocalStore('sort', e.currentTarget.value)
                }
              >
                {Object.keys(sortFns).map((key) => (
                  <option value={key}>Sort by {key}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
            <button
              onClick={() => {
                props.setLocalStore('sortOrder', String(sortOrder() * -1))
              }}
              aria-label={`Sort order ${
                sortOrder() === -1 ? 'descending' : 'ascending'
              }`}
              aria-pressed={sortOrder() === -1}
            >
              <Show when={sortOrder() === 1}>
                <span>Asc</span>
                <ArrowUp />
              </Show>
              <Show when={sortOrder() === -1}>
                <span>Desc</span>
                <ArrowDown />
              </Show>
            </button>
          </div>

          <div class={styles.actionsContainer}>
            <button
              onClick={() => {
                if (offline()) {
                  onlineManager().setOnline(undefined)
                  setOffline(false)
                  window.dispatchEvent(new Event('online'))
                } else {
                  onlineManager().setOnline(false)
                  setOffline(true)
                }
              }}
              class={styles.actionsBtn}
              aria-label={`${
                offline()
                  ? 'Unset offline mocking behavior'
                  : 'Mock offline behavior'
              }`}
              aria-pressed={offline()}
            >
              {offline() ? <Offline /> : <Wifi />}
            </button>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setSettingsOpen((prev) => !prev)}
                class={styles.actionsBtn}
                id="TSQD-settings-menu-btn"
                aria-label={`${
                  settingsOpen() ? 'Close' : 'Open'
                } settings menu`}
                aria-haspopup="true"
                aria-controls="TSQD-settings-menu"
              >
                <Settings />
              </button>
              <Show when={settingsOpen()}>
                <div
                  role="menu"
                  tabindex="-1"
                  aria-labelledby="TSQD-settings-menu-btn"
                  id="TSQD-settings-menu"
                  class={styles.settingsMenu}
                >
                  <div class={styles.settingsMenuHeader}>Position</div>
                  <div class={styles.settingsMenuSection}>
                    <button
                      onClick={() => {
                        setDevtoolsPosition('top')
                      }}
                      aria-label="Position top"
                    >
                      <ArrowUp />
                      <span>Top</span>
                    </button>
                    <button
                      onClick={() => {
                        setDevtoolsPosition('bottom')
                      }}
                      aria-label="Position bottom"
                    >
                      <ArrowDown />
                      <span>Bottom</span>
                    </button>
                    <button
                      onClick={() => {
                        setDevtoolsPosition('left')
                      }}
                      aria-label="Position left"
                    >
                      <ArrowDown />
                      <span>Left</span>
                    </button>
                    <button
                      onClick={() => {
                        setDevtoolsPosition('right')
                      }}
                      aria-label="Position right"
                    >
                      <ArrowDown />
                      <span>Right</span>
                    </button>
                  </div>
                </div>
              </Show>
            </div>
          </div>
        </div>
        <div class={styles.overflowQueryContainer}>
          <div>
            <Key by={(q) => q.queryHash} each={queries()}>
              {(query) => <QueryRow query={query()} />}
            </Key>
          </div>
        </div>
      </div>
      <Show when={selectedQueryHash()}>
        <QueryDetails />
      </Show>
    </aside>
  )
}

export const QueryRow: Component<{ query: Query }> = (props) => {
  const styles = getStyles()

  const queryState = createSubscribeToQueryCacheBatcher(
    (queryCache) =>
      queryCache().find({
        queryKey: props.query.queryKey,
      })?.state,
  )

  const isDisabled = createSubscribeToQueryCacheBatcher(
    (queryCache) =>
      queryCache()
        .find({
          queryKey: props.query.queryKey,
        })
        ?.isDisabled() ?? false,
  )

  const isStale = createSubscribeToQueryCacheBatcher(
    (queryCache) =>
      queryCache()
        .find({
          queryKey: props.query.queryKey,
        })
        ?.isStale() ?? false,
  )

  const observers = createSubscribeToQueryCacheBatcher(
    (queryCache) =>
      queryCache()
        .find({
          queryKey: props.query.queryKey,
        })
        ?.getObserversCount() ?? 0,
  )

  const color = createMemo(() =>
    getQueryStatusColor({
      queryState: queryState()!,
      observerCount: observers(),
      isStale: isStale(),
    }),
  )

  return (
    <Show when={queryState()}>
      <button
        onClick={() =>
          setSelectedQueryHash(
            props.query.queryHash === selectedQueryHash()
              ? null
              : props.query.queryHash,
          )
        }
        class={cx(
          styles.queryRow,
          selectedQueryHash() === props.query.queryHash &&
            styles.selectedQueryRow,
        )}
        aria-label={`Query key ${props.query.queryHash}`}
      >
        <div
          class={cx(
            'TSQDObserverCount',
            color() === 'gray'
              ? css`
                  background-color: ${tokens.colors[color()][700]};
                  color: ${tokens.colors[color()][300]};
                `
              : css`
                  background-color: ${tokens.colors[color()][900]};
                  color: ${tokens.colors[color()][300]} !important;
                `,
          )}
        >
          {observers()}
        </div>
        <code class="TSQDQueryHash">{props.query.queryHash}</code>
        <Show when={isDisabled()}>
          <div class="TSQDQueryDisabled">disabled</div>
        </Show>
      </button>
    </Show>
  )
}

export const QueryStatusCount: Component = () => {
  const stale = createSubscribeToQueryCacheBatcher(
    (queryCache) =>
      queryCache()
        .getAll()
        .filter((q) => getQueryStatusLabel(q) === 'stale').length,
  )

  const fresh = createSubscribeToQueryCacheBatcher(
    (queryCache) =>
      queryCache()
        .getAll()
        .filter((q) => getQueryStatusLabel(q) === 'fresh').length,
  )

  const fetching = createSubscribeToQueryCacheBatcher(
    (queryCache) =>
      queryCache()
        .getAll()
        .filter((q) => getQueryStatusLabel(q) === 'fetching').length,
  )

  const paused = createSubscribeToQueryCacheBatcher(
    (queryCache) =>
      queryCache()
        .getAll()
        .filter((q) => getQueryStatusLabel(q) === 'paused').length,
  )

  const inactive = createSubscribeToQueryCacheBatcher(
    (queryCache) =>
      queryCache()
        .getAll()
        .filter((q) => getQueryStatusLabel(q) === 'inactive').length,
  )

  const styles = getStyles()

  return (
    <div class={styles.queryStatusContainer}>
      <QueryStatus label="Fresh" color="green" count={fresh()} />
      <QueryStatus label="Fetching" color="blue" count={fetching()} />
      <QueryStatus label="Paused" color="purple" count={paused()} />
      <QueryStatus label="Stale" color="yellow" count={stale()} />
      <QueryStatus label="Inactive" color="gray" count={inactive()} />
    </div>
  )
}

export const QueryStatus: Component<QueryStatusProps> = (props) => {
  const styles = getStyles()

  let tagRef!: HTMLDivElement

  const [mouseOver, setMouseOver] = createSignal(false)

  onMount(() => {
    const mouseOverHandler = () => setMouseOver(true)
    const mouseOutHandler = () => setMouseOver(false)

    tagRef.addEventListener('mouseenter', mouseOverHandler)
    tagRef.addEventListener('mouseleave', mouseOutHandler)

    onCleanup(() => {
      tagRef.removeEventListener('mouseenter', mouseOverHandler)
      tagRef.removeEventListener('mouseleave', mouseOutHandler)
    })
  })

  const showLabel = createMemo(() => {
    if (selectedQueryHash()) {
      if (panelWidth() < firstBreakpoint && panelWidth() > secondBreakpoint) {
        return false
      }
    }
    if (panelWidth() < thirdBreakpoint) {
      return false
    }

    return true
  })

  return (
    <div ref={tagRef} class={styles.queryStatusTag}>
      <Show when={!showLabel() && mouseOver()}>
        <div class={cx(styles.statusTooltip)}>{props.label}</div>
      </Show>
      <span
        class={css`
          width: ${tokens.size[2]};
          height: ${tokens.size[2]};
          border-radius: ${tokens.border.radius.full};
          background-color: ${tokens.colors[props.color][500]};
        `}
      />
      <Show when={showLabel()}>
        <span>{props.label}</span>
      </Show>
      <span
        class={cx(
          styles.queryStatusCount,
          props.count > 0 && props.color !== 'gray'
            ? css`
                background-color: ${tokens.colors[props.color][900]};
                color: ${tokens.colors[props.color][300]} !important;
              `
            : css`
                color: ${tokens.colors['gray'][400]} !important;
              `,
        )}
      >
        {props.count}
      </span>
    </div>
  )
}

const QueryDetails = () => {
  const styles = getStyles()
  const queryClient = useQueryDevtoolsContext().client

  const [restoringLoading, setRestoringLoading] = createSignal(false)

  const activeQuery = createSubscribeToQueryCacheBatcher(
    (queryCache) =>
      queryCache()
        .getAll()
        .find((query) => query.queryHash === selectedQueryHash()),
    false,
  )

  const activeQueryFresh = createSubscribeToQueryCacheBatcher((queryCache) => {
    return queryCache()
      .getAll()
      .find((query) => query.queryHash === selectedQueryHash())
  }, false)

  const activeQueryState = createSubscribeToQueryCacheBatcher(
    (queryCache) =>
      queryCache()
        .getAll()
        .find((query) => query.queryHash === selectedQueryHash())?.state,
    false,
  )

  const activeQueryStateData = createSubscribeToQueryCacheBatcher(
    (queryCache) => {
      return queryCache()
        .getAll()
        .find((query) => query.queryHash === selectedQueryHash())?.state.data
    },
    false,
  )

  const statusLabel = createSubscribeToQueryCacheBatcher((queryCache) => {
    const query = queryCache()
      .getAll()
      .find((q) => q.queryHash === selectedQueryHash())
    if (!query) return 'inactive'
    return getQueryStatusLabel(query)
  })

  const queryStatus = createSubscribeToQueryCacheBatcher((queryCache) => {
    const query = queryCache()
      .getAll()
      .find((q) => q.queryHash === selectedQueryHash())
    if (!query) return 'pending'
    return query.state.status
  })

  const observerCount = createSubscribeToQueryCacheBatcher(
    (queryCache) =>
      queryCache()
        .getAll()
        .find((query) => query.queryHash === selectedQueryHash())
        ?.getObserversCount() ?? 0,
  )

  const color = createMemo(() => getQueryStatusColorByLabel(statusLabel()))

  const handleRefetch = () => {
    const promise = activeQuery()?.fetch()
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    promise?.catch(() => {})
  }

  const triggerError = (errorType?: DevToolsErrorType) => {
    const error =
      errorType?.initializer(activeQuery()!) ??
      new Error('Unknown error from devtools')

    const __previousQueryOptions = activeQuery()!.options

    activeQuery()!.setState({
      status: 'error',
      error,
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      fetchMeta: {
        ...activeQuery()!.state.fetchMeta,
        __previousQueryOptions,
      } as any,
    } as QueryState<unknown, Error>)
  }

  const restoreQueryAfterLoadingOrError = () => {
    activeQuery()?.fetch(
      (activeQuery()?.state.fetchMeta as any).__previousQueryOptions,
      {
        // Make sure this fetch will cancel the previous one
        cancelRefetch: true,
      },
    )
  }

  createEffect(() => {
    if (statusLabel() !== 'fetching') {
      setRestoringLoading(false)
    }
  })

  return (
    <Show when={activeQuery() && activeQueryState()}>
      <div class={styles.detailsContainer}>
        <div class={styles.detailsHeader}>Query Details</div>
        <div class={styles.detailsBody}>
          <div>
            <pre>
              <code>{displayValue(activeQuery()!.queryKey, true)}</code>
            </pre>
            <span
              class={cx(
                styles.queryDetailsStatus,
                color() === 'gray'
                  ? css`
                      background-color: ${tokens.colors[color()][700]};
                      color: ${tokens.colors[color()][300]};
                      border-color: ${tokens.colors[color()][600]};
                    `
                  : css`
                      background-color: ${tokens.colors[color()][900]};
                      color: ${tokens.colors[color()][300]};
                      border-color: ${tokens.colors[color()][600]};
                    `,
              )}
            >
              {statusLabel()}
            </span>
          </div>
          <div>
            <span>Observers:</span>
            <span>{observerCount()}</span>
          </div>
          <div>
            <span>Last Updated:</span>
            <span>
              {new Date(activeQueryState()!.dataUpdatedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
        <div class={styles.detailsHeader}>Actions</div>
        <div class={styles.actionsBody}>
          <button
            class={css`
              color: ${tokens.colors.blue[400]};
            `}
            onClick={handleRefetch}
            disabled={statusLabel() === 'fetching'}
          >
            <span
              class={css`
                background-color: ${tokens.colors.blue[400]};
              `}
            ></span>
            Refetch
          </button>
          <button
            class={css`
              color: ${tokens.colors.yellow[400]};
            `}
            onClick={() => queryClient.invalidateQueries(activeQuery())}
          >
            <span
              class={css`
                background-color: ${tokens.colors.yellow[400]};
              `}
            ></span>
            Invalidate
          </button>
          <button
            class={css`
              color: ${tokens.colors.gray[300]};
            `}
            onClick={() => queryClient.resetQueries(activeQuery())}
          >
            <span
              class={css`
                background-color: ${tokens.colors.gray[400]};
              `}
            ></span>
            Reset
          </button>
          <button
            class={css`
              color: ${tokens.colors.cyan[400]};
            `}
            disabled={restoringLoading()}
            onClick={() => {
              if (activeQuery()?.state.data === undefined) {
                setRestoringLoading(true)
                restoreQueryAfterLoadingOrError()
              } else {
                const activeQueryVal = activeQuery()
                if (!activeQueryVal) return
                const __previousQueryOptions = activeQueryVal.options
                // Trigger a fetch in order to trigger suspense as well.
                activeQueryVal.fetch({
                  ...__previousQueryOptions,
                  queryFn: () => {
                    return new Promise(() => {
                      // Never resolve
                    })
                  },
                  gcTime: -1,
                })
                activeQueryVal.setState({
                  data: undefined,
                  status: 'pending',
                  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                  fetchMeta: {
                    ...activeQueryVal.state.fetchMeta,
                    __previousQueryOptions,
                  } as any,
                } as QueryState<unknown, Error>)
              }
            }}
          >
            <span
              class={css`
                background-color: ${tokens.colors.cyan[400]};
              `}
            ></span>
            {statusLabel() === 'fetching' ? 'Restore' : 'Trigger'} Loading
          </button>
          <button
            class={css`
              color: ${tokens.colors.red[400]};
            `}
            onClick={() => {
              if (!activeQuery()!.state.error) {
                triggerError()
              } else {
                queryClient.resetQueries(activeQuery())
              }
            }}
          >
            <span
              class={css`
                background-color: ${tokens.colors.red[400]};
              `}
            ></span>
            {queryStatus() === 'error' ? 'Restore' : 'Trigger'} Error
          </button>
        </div>
        <div class={styles.detailsHeader}>Data Explorer</div>
        <div
          style={{
            padding: '0.5rem',
          }}
        >
          <Explorer
            label="Data"
            defaultExpanded={['Data']}
            value={activeQueryStateData()}
            copyable={true}
          />
        </div>
        <div class={styles.detailsHeader}>Query Explorer</div>
        <div
          style={{
            padding: '0.5rem',
          }}
        >
          <Explorer
            label="Query"
            defaultExpanded={['Query', 'queryKey']}
            value={activeQueryFresh()}
          />
        </div>
      </div>
    </Show>
  )
}

const signalsMap = new Map<(q: Accessor<QueryCache>) => any, Setter<any>>()

const setupQueryCacheSubscription = () => {
  const queryCache = createMemo(() => {
    const client = useQueryDevtoolsContext().client
    return client.getQueryCache()
  })

  const unsub = queryCache().subscribe(() => {
    for (const [callback, setter] of signalsMap.entries()) {
      queueMicrotask(() => {
        setter(callback(queryCache))
      })
    }
  })

  onCleanup(() => {
    signalsMap.clear()
    unsub()
  })

  return unsub
}

const createSubscribeToQueryCacheBatcher = <T,>(
  callback: (queryCache: Accessor<QueryCache>) => Exclude<T, Function>,
  equalityCheck: boolean = true,
) => {
  const queryCache = createMemo(() => {
    const client = useQueryDevtoolsContext().client
    return client.getQueryCache()
  })

  const [value, setValue] = createSignal<T>(
    callback(queryCache),
    !equalityCheck ? { equals: false } : undefined,
  )

  createEffect(() => {
    setValue(callback(queryCache))
  })

  // @ts-ignore
  signalsMap.set(callback, setValue)

  onCleanup(() => {
    // @ts-ignore
    signalsMap.delete(callback)
  })

  return value
}

const getStyles = () => {
  const { colors, font, size, alpha, shadow, border } = tokens

  return {
    devtoolsBtn: css`
      z-index: 100000;
      position: fixed;
      padding: 4px;

      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 9999px;
      box-shadow: ${shadow.md()};
      overflow: hidden;

      & div {
        position: absolute;
        top: -8px;
        left: -8px;
        right: -8px;
        bottom: -8px;
        border-radius: 9999px;

        & svg {
          position: absolute;
          width: 100%;
          height: 100%;
        }
        filter: blur(6px) saturate(1.2) contrast(1.1);
      }

      &:focus-within {
        outline-offset: 2px;
        outline: 3px solid ${colors.green[600]};
      }

      & button {
        position: relative;
        z-index: 1;
        padding: 0;
        border-radius: 9999px;
        background-color: transparent;
        border: none;
        height: 40px;
        display: flex;
        width: 40px;
        overflow: hidden;
        cursor: pointer;
        outline: none;
        & svg {
          position: absolute;
          width: 100%;
          height: 100%;
        }
      }
    `,
    panel: css`
      position: fixed;
      z-index: 9999;
      display: flex;
      gap: ${tokens.size[0.5]};
      overflow: hidden;
      & * {
        font-family: 'Inter', sans-serif;
        color: ${colors.gray[300]};
        box-sizing: border-box;
      }
    `,
    'devtoolsBtn-position-bottom-right': css`
      bottom: 12px;
      right: 12px;
    `,
    'devtoolsBtn-position-bottom-left': css`
      bottom: 12px;
      left: 12px;
    `,
    'devtoolsBtn-position-top-left': css`
      top: 12px;
      left: 12px;
    `,
    'devtoolsBtn-position-top-right': css`
      top: 12px;
      right: 12px;
    `,
    'panel-position-top': css`
      top: 0;
      right: 0;
      left: 0;
      max-height: 90%;
      min-height: 3.5rem;
      border-bottom: ${colors.darkGray[300]} 1px solid;
    `,
    'panel-position-bottom': css`
      bottom: 0;
      right: 0;
      left: 0;
      max-height: 90%;
      min-height: 3.5rem;
      border-top: ${colors.darkGray[300]} 1px solid;
    `,
    'panel-position-right': css`
      bottom: 0;
      right: 0;
      top: 0;
      border-left: ${colors.darkGray[300]} 1px solid;
      max-width: 90%;
    `,
    'panel-position-left': css`
      bottom: 0;
      left: 0;
      top: 0;
      border-right: ${colors.darkGray[300]} 1px solid;
      max-width: 90%;
    `,
    queriesContainer: css`
      flex: 1 1 700px;
      background-color: ${colors.darkGray[700]};
      display: flex;
      flex-direction: column;
    `,
    dragHandle: css`
      position: absolute;
      transition: background-color 0.125s ease;
      &:hover {
        background-color: ${colors.gray[400]}${alpha[90]};
      }
      z-index: 4;
    `,
    'dragHandle-position-top': css`
      bottom: 0;
      width: 100%;
      height: ${tokens.size[1]};
      cursor: ns-resize;
    `,
    'dragHandle-position-bottom': css`
      top: 0;
      width: 100%;
      height: ${tokens.size[1]};
      cursor: ns-resize;
    `,
    'dragHandle-position-right': css`
      left: 0;
      width: ${tokens.size[1]};
      height: 100%;
      cursor: ew-resize;
    `,
    'dragHandle-position-left': css`
      right: 0;
      width: ${tokens.size[1]};
      height: 100%;
      cursor: ew-resize;
    `,
    row: css`
      display: flex;
      justify-content: space-between;
      padding: ${tokens.size[2.5]} ${tokens.size[3]};
      gap: ${tokens.size[4]};
      border-bottom: ${colors.darkGray[500]} 1px solid;
      align-items: center;
      & > button {
        padding: 0;
        background: transparent;
        border: none;
        display: flex;
        flex-direction: column;
      }
    `,
    logo: css`
      cursor: pointer;
      &:hover {
        opacity: 0.7;
      }
      &:focus-visible {
        outline-offset: 4px;
        border-radius: ${border.radius.xs};
        outline: 2px solid ${colors.blue[800]};
      }
    `,
    tanstackLogo: css`
      font-size: ${font.size.lg};
      font-weight: ${font.weight.extrabold};
      line-height: ${font.lineHeight.sm};
      white-space: nowrap;
    `,
    queryFlavorLogo: css`
      font-weight: ${font.weight.semibold};
      font-size: ${font.size.sm};
      background: linear-gradient(to right, #dd524b, #e9a03b);
      background-clip: text;
      line-height: ${font.lineHeight.xs};
      -webkit-text-fill-color: transparent;
      white-space: nowrap;
    `,
    queryStatusContainer: css`
      display: flex;
      gap: ${tokens.size[2]};
      height: min-content;
    `,
    queryStatusTag: css`
      display: flex;
      cursor: pointer;
      gap: ${tokens.size[1.5]};
      background: ${colors.darkGray[500]};
      border-radius: ${tokens.border.radius.md};
      font-size: ${font.size.sm};
      padding: ${tokens.size[1]};
      padding-left: ${tokens.size[2.5]};
      align-items: center;
      line-height: ${font.lineHeight.md};
      font-weight: ${font.weight.medium};
      border: none;
      user-select: none;
      position: relative;
      &:hover {
        background: ${colors.darkGray[400]}${alpha[80]};
      }
      & span:nth-child(2) {
        color: ${colors.gray[300]}${alpha[80]};
      }
    `,
    statusTooltip: css`
      position: absolute;
      z-index: 1;
      background-color: ${colors.darkGray[500]};
      top: 100%;
      left: 50%;
      transform: translate(-50%, calc(${tokens.size[2]}));
      padding: ${tokens.size[0.5]} ${tokens.size[3]};
      border-radius: ${tokens.border.radius.md};
      font-size: ${font.size.sm};
      border: 2px solid ${colors.gray[600]};
      color: ${tokens.colors['gray'][300]};

      &::before {
        top: 0px;
        content: ' ';
        display: block;
        left: 50%;
        transform: translate(-50%, -100%);
        position: absolute;
        border-color: transparent transparent ${colors.gray[600]} transparent;
        border-style: solid;
        border-width: 7px;
        /* transform: rotate(180deg); */
      }

      &::after {
        top: 0px;
        content: ' ';
        display: block;
        left: 50%;
        transform: translate(-50%, calc(-100% + 2.5px));
        position: absolute;
        border-color: transparent transparent ${colors.darkGray[500]}
          transparent;
        border-style: solid;
        border-width: 7px;
      }
    `,
    selectedQueryRow: css`
      background-color: ${colors.darkGray[500]};
    `,
    queryStatusCount: css`
      padding: 0 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${colors.gray[400]};
      background-color: ${colors.darkGray[300]};
      border-radius: 3px;
      font-variant-numeric: tabular-nums;
    `,
    filtersContainer: css`
      display: flex;
      gap: ${tokens.size[2.5]};
      & > button {
        cursor: pointer;
        padding: ${tokens.size[1.5]} ${tokens.size[2.5]};
        padding-right: ${tokens.size[1.5]};
        border-radius: ${tokens.border.radius.md};
        background-color: ${colors.darkGray[400]};
        font-size: ${font.size.sm};
        display: flex;
        align-items: center;
        line-height: ${font.lineHeight.sm};
        gap: ${tokens.size[1.5]};
        max-width: 160px;
        border: 1px solid ${colors.darkGray[200]};
        &:focus-visible {
          outline-offset: 2px;
          border-radius: ${border.radius.xs};
          outline: 2px solid ${colors.blue[800]};
        }
      }
    `,
    filterInput: css`
      padding: ${tokens.size[1.5]} ${tokens.size[2.5]};
      border-radius: ${tokens.border.radius.md};
      background-color: ${colors.darkGray[400]};
      display: flex;
      box-sizing: content-box;
      align-items: center;
      gap: ${tokens.size[1.5]};
      max-width: 160px;
      min-width: 100px;
      border: 1px solid ${colors.darkGray[200]};
      height: min-content;
      & > svg {
        width: ${tokens.size[3.5]};
        height: ${tokens.size[3.5]};
      }
      & input {
        font-size: ${font.size.sm};
        width: 100%;
        background-color: ${colors.darkGray[400]};
        border: none;
        padding: 0;
        line-height: ${font.lineHeight.sm};
        color: ${colors.gray[300]};
        &::placeholder {
          color: ${colors.gray[300]};
        }
        &:focus {
          outline: none;
        }
      }

      &:focus-within {
        outline-offset: 2px;
        border-radius: ${border.radius.xs};
        outline: 2px solid ${colors.blue[800]};
      }
    `,
    filterSelect: css`
      padding: ${tokens.size[1.5]} ${tokens.size[2.5]};
      border-radius: ${tokens.border.radius.md};
      background-color: ${colors.darkGray[400]};
      display: flex;
      align-items: center;
      gap: ${tokens.size[1.5]};
      box-sizing: content-box;
      max-width: 160px;
      border: 1px solid ${colors.darkGray[200]};
      height: min-content;
      & > svg {
        width: ${tokens.size[3]};
        height: ${tokens.size[3]};
      }
      & > select {
        appearance: none;
        min-width: 100px;
        line-height: ${font.lineHeight.sm};
        font-size: ${font.size.sm};
        background-color: ${colors.darkGray[400]};
        border: none;
        &:focus {
          outline: none;
        }
      }
      &:focus-within {
        outline-offset: 2px;
        border-radius: ${border.radius.xs};
        outline: 2px solid ${colors.blue[800]};
      }
    `,
    actionsContainer: css`
      display: flex;
      gap: ${tokens.size[2.5]};
    `,
    actionsBtn: css`
      border-radius: ${tokens.border.radius.md};
      background-color: ${colors.darkGray[400]};
      width: 2.125rem; // 34px
      height: 2.125rem; // 34px
      justify-content: center;
      display: flex;
      align-items: center;
      gap: ${tokens.size[1.5]};
      max-width: 160px;
      border: 1px solid ${colors.darkGray[200]};
      cursor: pointer;
      &:hover {
        background-color: ${colors.darkGray[500]};
      }
      & svg {
        width: ${tokens.size[4]};
        height: ${tokens.size[4]};
      }
      &:focus-visible {
        outline-offset: 2px;
        border-radius: ${border.radius.xs};
        outline: 2px solid ${colors.blue[800]};
      }
    `,
    overflowQueryContainer: css`
      flex: 1;
      overflow-y: auto;
      & > div {
        display: flex;
        flex-direction: column;
      }
    `,
    queryRow: css`
      display: flex;
      align-items: center;
      padding: 0;
      background-color: inherit;
      border: none;
      cursor: pointer;
      &:focus-visible {
        outline-offset: -2px;
        border-radius: ${border.radius.xs};
        outline: 2px solid ${colors.blue[800]};
      }
      &:hover .TSQDQueryHash {
        background-color: ${colors.darkGray[600]};
      }

      & .TSQDObserverCount {
        padding: 0 ${tokens.size[1]};
        user-select: none;
        min-width: ${tokens.size[8]};
        align-self: stretch !important;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${font.size.sm};
        font-weight: ${font.weight.medium};
        border-bottom: 1px solid ${colors.darkGray[700]};
      }
      & .TSQDQueryHash {
        user-select: text;
        font-size: ${font.size.sm};
        display: flex;
        align-items: center;
        min-height: ${tokens.size[8]};
        flex: 1;
        padding: ${tokens.size[1]} ${tokens.size[2]};
        font-family: 'Menlo', 'Fira Code', monospace !important;
        border-bottom: 1px solid ${colors.darkGray[400]};
        text-align: left;
        text-overflow: clip;
        word-break: break-word;
      }

      & .TSQDQueryDisabled {
        align-self: stretch;
        align-self: stretch !important;
        display: flex;
        align-items: center;
        padding: 0 ${tokens.size[3]};
        color: ${colors.gray[300]};
        background-color: ${colors.darkGray[600]};
        border-bottom: 1px solid ${colors.darkGray[400]};
        font-size: ${font.size.sm};
      }
    `,
    detailsContainer: css`
      flex: 1 1 700px;
      background-color: ${colors.darkGray[700]};
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      display: flex;
    `,
    detailsHeader: css`
      position: sticky;
      top: 0;
      z-index: 2;
      background-color: ${colors.darkGray[600]};
      padding: ${tokens.size[2]} ${tokens.size[2]};
      font-weight: ${font.weight.medium};
      font-size: ${font.size.sm};
    `,
    detailsBody: css`
      margin: ${tokens.size[2]} 0px ${tokens.size[3]} 0px;
      & > div {
        display: flex;
        align-items: stretch;
        padding: 0 ${tokens.size[2]};
        line-height: ${font.lineHeight.sm};
        justify-content: space-between;
        & > span {
          font-size: ${font.size.sm};
        }
        & > span:nth-child(2) {
          font-variant-numeric: tabular-nums;
        }
      }

      & > div:first-child {
        margin-bottom: ${tokens.size[2]};
      }

      & code {
        font-family: 'Menlo', 'Fira Code', monospace !important;
        margin: 0;
        font-size: ${font.size.sm};
        line-height: ${font.lineHeight.sm};
      }
    `,
    queryDetailsStatus: css`
      border: 1px solid ${colors.darkGray[200]};
      border-radius: ${tokens.border.radius.md};
      font-weight: ${font.weight.medium};
      padding: ${tokens.size[1]} ${tokens.size[2.5]};
    `,
    actionsBody: css`
      flex-wrap: wrap;
      margin: ${tokens.size[3]} 0px ${tokens.size[3]} 0px;
      display: flex;
      gap: ${tokens.size[2]};
      padding: 0px ${tokens.size[2]};
      & > button {
        font-size: ${font.size.sm};
        padding: ${tokens.size[2]} ${tokens.size[2]};
        display: flex;
        border-radius: ${tokens.border.radius.md};
        border: 1px solid ${colors.darkGray[400]};
        background-color: ${colors.darkGray[600]};
        align-items: center;
        gap: ${tokens.size[2]};
        font-weight: ${font.weight.medium};
        line-height: ${font.lineHeight.sm};
        cursor: pointer;
        &:focus-visible {
          outline-offset: 2px;
          border-radius: ${border.radius.xs};
          outline: 2px solid ${colors.blue[800]};
        }
        &:hover {
          background-color: ${colors.darkGray[500]};
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        & > span {
          width: ${size[2]};
          height: ${size[2]};
          border-radius: ${tokens.border.radius.full};
        }
      }
    `,
    settingsMenu: css`
      position: absolute;
      top: calc(100% + ${tokens.size[2]});
      border-radius: ${tokens.border.radius.lg};
      border: 1px solid ${colors.gray[600]};
      right: 0;
      min-width: ${tokens.size[44]};
      background-color: ${colors.darkGray[400]};
      font-size: ${font.size.sm};
      color: ${colors.gray[500]};
      z-index: 2;
    `,
    settingsMenuHeader: css`
      padding: ${tokens.size[1.5]} ${tokens.size[2.5]};
      color: ${colors.gray[300]};
      font-weight: ${font.weight.medium};
    `,
    settingsMenuSection: css`
      border-top: 1px solid ${colors.gray[600]};
      display: flex;
      flex-direction: column;
      padding: ${tokens.size[1]} ${tokens.size[1]};

      & > button {
        cursor: pointer;
        background-color: transparent;
        border: none;
        padding: ${tokens.size[2]} ${tokens.size[1.5]};
        font-size: ${font.size.sm};
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: ${tokens.size[2]};
        border-radius: ${tokens.border.radius.md};
        &:hover {
          background-color: ${colors.darkGray[500]};
        }

        &:focus-visible {
          outline-offset: 2px;
          outline: 2px solid ${colors.blue[800]};
        }
      }

      & button:nth-child(4) svg {
        transform: rotate(-90deg);
      }

      & button:nth-child(3) svg {
        transform: rotate(90deg);
      }
    `,
  }
}
