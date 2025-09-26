import {
  For,
  Show,
  batch,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
} from 'solid-js'
import { rankItem } from '@tanstack/match-sorter-utils'
import * as goober from 'goober'
import { clsx as cx } from 'clsx'
import { TransitionGroup } from 'solid-transition-group'
import { Key } from '@solid-primitives/keyed'
import { createResizeObserver } from '@solid-primitives/resize-observer'
import { DropdownMenu, RadioGroup } from '@kobalte/core'
import { Portal } from 'solid-js/web'
import { tokens } from './theme'
import {
  convertRemToPixels,
  displayValue,
  getMutationStatusColor,
  getQueryStatusColor,
  getQueryStatusColorByLabel,
  getQueryStatusLabel,
  getSidedProp,
  mutationSortFns,
  sortFns,
} from './utils'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CheckCircle,
  ChevronDown,
  LoadingCircle,
  Monitor,
  Moon,
  Offline,
  PauseCircle,
  PiPIcon,
  Search,
  Settings,
  Sun,
  TanstackLogo,
  Trash,
  Wifi,
  XCircle,
} from './icons'
import Explorer from './Explorer'
import { usePiPWindow, useQueryDevtoolsContext, useTheme } from './contexts'
import {
  BUTTON_POSITION,
  DEFAULT_HEIGHT,
  DEFAULT_MUTATION_SORT_FN_NAME,
  DEFAULT_SORT_FN_NAME,
  DEFAULT_SORT_ORDER,
  DEFAULT_WIDTH,
  INITIAL_IS_OPEN,
  POSITION,
  firstBreakpoint,
  secondBreakpoint,
  thirdBreakpoint,
} from './constants'
import type {
  DevtoolsErrorType,
  DevtoolsPosition,
  QueryDevtoolsProps,
} from './contexts'
import type {
  Mutation,
  MutationCache,
  Query,
  QueryCache,
  QueryCacheNotifyEvent,
  QueryState,
} from '@tanstack/query-core'
import type { StorageObject, StorageSetter } from '@solid-primitives/storage'
import type { Accessor, Component, JSX, Setter } from 'solid-js'

interface DevtoolsPanelProps {
  localStore: StorageObject<string>
  setLocalStore: StorageSetter<string, unknown>
}

interface ContentViewProps {
  localStore: StorageObject<string>
  setLocalStore: StorageSetter<string, unknown>
  showPanelViewOnly?: boolean
  onClose?: () => unknown
}

interface QueryStatusProps {
  label: string
  color: 'green' | 'yellow' | 'gray' | 'blue' | 'purple' | 'red'
  count: number
}

const [selectedQueryHash, setSelectedQueryHash] = createSignal<string | null>(
  null,
)
const [selectedMutationId, setSelectedMutationId] = createSignal<number | null>(
  null,
)
const [panelWidth, setPanelWidth] = createSignal(0)
const [offline, setOffline] = createSignal(false)

export type DevtoolsComponentType = Component<QueryDevtoolsProps> & {
  shadowDOMTarget?: ShadowRoot
}

export const Devtools: Component<DevtoolsPanelProps> = (props) => {
  const theme = useTheme()
  const css = useQueryDevtoolsContext().shadowDOMTarget
    ? goober.css.bind({ target: useQueryDevtoolsContext().shadowDOMTarget })
    : goober.css
  const styles = createMemo(() => {
    return theme() === 'dark' ? darkStyles(css) : lightStyles(css)
  })
  const onlineManager = createMemo(
    () => useQueryDevtoolsContext().onlineManager,
  )
  onMount(() => {
    const unsubscribe = onlineManager().subscribe((online) => {
      setOffline(!online)
    })

    onCleanup(() => {
      unsubscribe()
    })
  })

  const pip = usePiPWindow()

  const buttonPosition = createMemo(() => {
    return useQueryDevtoolsContext().buttonPosition || BUTTON_POSITION
  })

  const isOpen = createMemo(() => {
    return props.localStore.open === 'true'
      ? true
      : props.localStore.open === 'false'
        ? false
        : useQueryDevtoolsContext().initialIsOpen || INITIAL_IS_OPEN
  })

  const position = createMemo(() => {
    return (
      props.localStore.position ||
      useQueryDevtoolsContext().position ||
      POSITION
    )
  })

  let transitionsContainerRef!: HTMLDivElement
  createEffect(() => {
    const root = transitionsContainerRef.parentElement as HTMLElement
    const height = props.localStore.height || DEFAULT_HEIGHT
    const width = props.localStore.width || DEFAULT_WIDTH
    const panelPosition = position()
    root.style.setProperty(
      '--tsqd-panel-height',
      `${panelPosition === 'top' ? '-' : ''}${height}px`,
    )
    root.style.setProperty(
      '--tsqd-panel-width',
      `${panelPosition === 'left' ? '-' : ''}${width}px`,
    )
  })

  // Calculates the inherited font size of the parent and sets it as a CSS variable
  // All the design tokens are calculated based on this variable
  onMount(() => {
    // This is to make sure that the font size is updated when the stylesheet is updated
    // and the user focuses back on the window
    const onFocus = () => {
      const root = transitionsContainerRef.parentElement as HTMLElement
      const fontSize = getComputedStyle(root).fontSize
      root.style.setProperty('--tsqd-font-size', fontSize)
    }
    onFocus()
    window.addEventListener('focus', onFocus)
    onCleanup(() => {
      window.removeEventListener('focus', onFocus)
    })
  })

  const pip_open = createMemo(
    () => (props.localStore.pip_open ?? 'false') as 'true' | 'false',
  )

  return (
    <>
      <Show when={pip().pipWindow && pip_open() == 'true'}>
        <Portal mount={pip().pipWindow?.document.body}>
          <PiPPanel>
            <ContentView {...props} />
          </PiPPanel>
        </Portal>
      </Show>
      <div
        // styles for animating the panel in and out
        class={cx(
          css`
            & .tsqd-panel-transition-exit-active,
            & .tsqd-panel-transition-enter-active {
              transition:
                opacity 0.3s,
                transform 0.3s;
            }

            & .tsqd-panel-transition-exit-to,
            & .tsqd-panel-transition-enter {
              ${position() === 'top' || position() === 'bottom'
                ? `transform: translateY(var(--tsqd-panel-height));`
                : `transform: translateX(var(--tsqd-panel-width));`}
            }

            & .tsqd-button-transition-exit-active,
            & .tsqd-button-transition-enter-active {
              transition:
                opacity 0.3s,
                transform 0.3s;
              opacity: 1;
            }

            & .tsqd-button-transition-exit-to,
            & .tsqd-button-transition-enter {
              transform: ${buttonPosition() === 'relative'
                ? `none;`
                : buttonPosition() === 'top-left'
                  ? `translateX(-72px);`
                  : buttonPosition() === 'top-right'
                    ? `translateX(72px);`
                    : `translateY(72px);`};
              opacity: 0;
            }
          `,
          'tsqd-transitions-container',
        )}
        ref={transitionsContainerRef}
      >
        <TransitionGroup name="tsqd-panel-transition">
          <Show when={isOpen() && !pip().pipWindow && pip_open() == 'false'}>
            <DraggablePanel
              localStore={props.localStore}
              setLocalStore={props.setLocalStore}
            />
          </Show>
        </TransitionGroup>
        <TransitionGroup name="tsqd-button-transition">
          <Show when={!isOpen()}>
            <div
              class={cx(
                styles().devtoolsBtn,
                styles()[`devtoolsBtn-position-${buttonPosition()}`],
                'tsqd-open-btn-container',
              )}
            >
              <div aria-hidden="true">
                <TanstackLogo />
              </div>
              <button
                type="button"
                aria-label="Open Tanstack query devtools"
                onClick={() => props.setLocalStore('open', 'true')}
                class="tsqd-open-btn"
              >
                <TanstackLogo />
              </button>
            </div>
          </Show>
        </TransitionGroup>
      </div>
    </>
  )
}

const PiPPanel: Component<{
  children: JSX.Element
}> = (props) => {
  const pip = usePiPWindow()
  const theme = useTheme()
  const css = useQueryDevtoolsContext().shadowDOMTarget
    ? goober.css.bind({ target: useQueryDevtoolsContext().shadowDOMTarget })
    : goober.css
  const styles = createMemo(() => {
    return theme() === 'dark' ? darkStyles(css) : lightStyles(css)
  })

  const getPanelDynamicStyles = () => {
    const { colors } = tokens
    const t = (light: string, dark: string) =>
      theme() === 'dark' ? dark : light
    if (panelWidth() < secondBreakpoint) {
      return css`
        flex-direction: column;
        background-color: ${t(colors.gray[300], colors.gray[600])};
      `
    }
    return css`
      flex-direction: row;
      background-color: ${t(colors.gray[200], colors.darkGray[900])};
    `
  }

  createEffect(() => {
    const win = pip().pipWindow
    const resizeCB = () => {
      if (!win) return
      setPanelWidth(win.innerWidth)
    }
    if (win) {
      win.addEventListener('resize', resizeCB)
      resizeCB()
    }

    onCleanup(() => {
      if (win) {
        win.removeEventListener('resize', resizeCB)
      }
    })
  })

  return (
    <div
      style={{
        '--tsqd-font-size': '16px',
        'max-height': '100vh',
        height: '100vh',
        width: '100vw',
      }}
      class={cx(
        styles().panel,
        getPanelDynamicStyles(),
        {
          [css`
            min-width: min-content;
          `]: panelWidth() < thirdBreakpoint,
        },
        'tsqd-main-panel',
      )}
    >
      {props.children}
    </div>
  )
}

export const ParentPanel: Component<{
  children: JSX.Element
}> = (props) => {
  const theme = useTheme()
  const css = useQueryDevtoolsContext().shadowDOMTarget
    ? goober.css.bind({ target: useQueryDevtoolsContext().shadowDOMTarget })
    : goober.css
  const styles = createMemo(() => {
    return theme() === 'dark' ? darkStyles(css) : lightStyles(css)
  })

  let panelRef!: HTMLDivElement

  onMount(() => {
    createResizeObserver(panelRef, ({ width }, el) => {
      if (el === panelRef) {
        setPanelWidth(width)
      }
    })
  })

  const getPanelDynamicStyles = () => {
    const { colors } = tokens
    const t = (light: string, dark: string) =>
      theme() === 'dark' ? dark : light
    if (panelWidth() < secondBreakpoint) {
      return css`
        flex-direction: column;
        background-color: ${t(colors.gray[300], colors.gray[600])};
      `
    }
    return css`
      flex-direction: row;
      background-color: ${t(colors.gray[200], colors.darkGray[900])};
    `
  }

  return (
    <div
      style={{
        '--tsqd-font-size': '16px',
      }}
      ref={panelRef}
      class={cx(
        styles().parentPanel,
        getPanelDynamicStyles(),
        {
          [css`
            min-width: min-content;
          `]: panelWidth() < thirdBreakpoint,
        },
        'tsqd-main-panel',
      )}
    >
      {props.children}
    </div>
  )
}

const DraggablePanel: Component<DevtoolsPanelProps> = (props) => {
  const theme = useTheme()
  const css = useQueryDevtoolsContext().shadowDOMTarget
    ? goober.css.bind({ target: useQueryDevtoolsContext().shadowDOMTarget })
    : goober.css
  const styles = createMemo(() => {
    return theme() === 'dark' ? darkStyles(css) : lightStyles(css)
  })

  const [isResizing, setIsResizing] = createSignal(false)

  const position = createMemo(
    () =>
      (props.localStore.position ||
        useQueryDevtoolsContext().position ||
        POSITION) as DevtoolsPosition,
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
        // If the panel size didn't decrease, this means we have reached the minimum width
        // of the panel so we restore the original width in local storage
        // Restoring the width helps in smooth open/close transitions
        if (Number(props.localStore.width) < newWidth) {
          props.setLocalStore('width', String(newWidth))
        }
      } else {
        const valToAdd =
          position() === 'bottom'
            ? startY - moveEvent.clientY
            : moveEvent.clientY - startY
        newSize = Math.round(height + valToAdd)
        // If the panel size is less than the minimum height,
        // we set the size to the minimum height
        if (newSize < minHeight) {
          newSize = minHeight
          setSelectedQueryHash(null)
        }
        props.setLocalStore('height', String(Math.round(newSize)))
      }
    }

    const unsubscribe = () => {
      if (isResizing()) {
        setIsResizing(false)
      }
      document.removeEventListener('mousemove', runDrag, false)
      document.removeEventListener('mouseUp', unsubscribe, false)
    }

    document.addEventListener('mousemove', runDrag, false)
    document.addEventListener('mouseup', unsubscribe, false)
  }

  let panelRef!: HTMLDivElement

  onMount(() => {
    createResizeObserver(panelRef, ({ width }, el) => {
      if (el === panelRef) {
        setPanelWidth(width)
      }
    })
  })

  createEffect(() => {
    const rootContainer = panelRef.parentElement?.parentElement?.parentElement
    if (!rootContainer) return
    const currentPosition = (props.localStore.position ||
      POSITION) as DevtoolsPosition
    const styleProp = getSidedProp('padding', currentPosition)
    const isVertical =
      props.localStore.position === 'left' ||
      props.localStore.position === 'right'
    const previousPaddings = (({
      padding,
      paddingTop,
      paddingBottom,
      paddingLeft,
      paddingRight,
    }) => ({
      padding,
      paddingTop,
      paddingBottom,
      paddingLeft,
      paddingRight,
    }))(rootContainer.style)

    rootContainer.style[styleProp] = `${
      isVertical ? props.localStore.width : props.localStore.height
    }px`

    onCleanup(() => {
      Object.entries(previousPaddings).forEach(([property, previousValue]) => {
        rootContainer.style[property as keyof typeof previousPaddings] =
          previousValue
      })
    })
  })

  const getPanelDynamicStyles = () => {
    const { colors } = tokens
    const t = (light: string, dark: string) =>
      theme() === 'dark' ? dark : light
    if (panelWidth() < secondBreakpoint) {
      return css`
        flex-direction: column;
        background-color: ${t(colors.gray[300], colors.gray[600])};
      `
    }
    return css`
      flex-direction: row;
      background-color: ${t(colors.gray[200], colors.darkGray[900])};
    `
  }

  return (
    <aside
      // Some context for styles here
      // background-color - Changes to a lighter color create a harder contrast
      // between the queries and query detail panel
      // -
      // min-width - When the panel is in the left or right position, the panel
      // width is set to min-content to allow the panel to shrink to the lowest possible width
      class={cx(
        styles().panel,
        styles()[`panel-position-${position()}`],
        getPanelDynamicStyles(),
        {
          [css`
            min-width: min-content;
          `]:
            panelWidth() < thirdBreakpoint &&
            (position() === 'right' || position() === 'left'),
        },
        'tsqd-main-panel',
      )}
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
          styles().dragHandle,
          styles()[`dragHandle-position-${position()}`],
          'tsqd-drag-handle',
        )}
        onMouseDown={handleDragStart}
      ></div>
      <button
        aria-label="Close tanstack query devtools"
        class={cx(
          styles().closeBtn,
          styles()[`closeBtn-position-${position()}`],
          'tsqd-minimize-btn',
        )}
        onClick={() => props.setLocalStore('open', 'false')}
      >
        <ChevronDown />
      </button>
      <ContentView {...props} />
    </aside>
  )
}

export const ContentView: Component<ContentViewProps> = (props) => {
  setupQueryCacheSubscription()
  setupMutationCacheSubscription()
  let containerRef!: HTMLDivElement
  const theme = useTheme()
  const css = useQueryDevtoolsContext().shadowDOMTarget
    ? goober.css.bind({ target: useQueryDevtoolsContext().shadowDOMTarget })
    : goober.css
  const styles = createMemo(() => {
    return theme() === 'dark' ? darkStyles(css) : lightStyles(css)
  })

  const pip = usePiPWindow()

  const [selectedView, setSelectedView] = createSignal<'queries' | 'mutations'>(
    'queries',
  )

  const sort = createMemo(() => props.localStore.sort || DEFAULT_SORT_FN_NAME)
  const sortOrder = createMemo(
    () => Number(props.localStore.sortOrder) || DEFAULT_SORT_ORDER,
  ) as () => 1 | -1

  const mutationSort = createMemo(
    () => props.localStore.mutationSort || DEFAULT_MUTATION_SORT_FN_NAME,
  )
  const mutationSortOrder = createMemo(
    () => Number(props.localStore.mutationSortOrder) || DEFAULT_SORT_ORDER,
  ) as () => 1 | -1

  const sortFn = createMemo(() => sortFns[sort() as string])
  const mutationSortFn = createMemo(
    () => mutationSortFns[mutationSort() as string],
  )

  const onlineManager = createMemo(
    () => useQueryDevtoolsContext().onlineManager,
  )

  const query_cache = createMemo(() => {
    return useQueryDevtoolsContext().client.getQueryCache()
  })

  const mutation_cache = createMemo(() => {
    return useQueryDevtoolsContext().client.getMutationCache()
  })

  const queryCount = createSubscribeToQueryCacheBatcher((queryCache) => {
    return queryCache().getAll().length
  }, false)

  const queries = createMemo(
    on(
      () => [
        queryCount(),
        props.localStore.filter,
        sort(),
        sortOrder(),
        props.localStore.hideDisabledQueries,
      ],
      () => {
        const curr = query_cache().getAll()

        let filtered = props.localStore.filter
          ? curr.filter(
              (item) =>
                rankItem(item.queryHash, props.localStore.filter || '').passed,
            )
          : [...curr]

        // Filter out disabled queries if hideDisabledQueries is enabled
        if (props.localStore.hideDisabledQueries === 'true') {
          filtered = filtered.filter((item) => !item.isDisabled())
        }

        const sorted = sortFn()
          ? filtered.sort((a, b) => sortFn()!(a, b) * sortOrder())
          : filtered
        return sorted
      },
    ),
  )

  const mutationCount = createSubscribeToMutationCacheBatcher(
    (mutationCache) => {
      return mutationCache().getAll().length
    },
    false,
  )

  const mutations = createMemo(
    on(
      () => [
        mutationCount(),
        props.localStore.mutationFilter,
        mutationSort(),
        mutationSortOrder(),
      ],
      () => {
        const curr = mutation_cache().getAll()

        const filtered = props.localStore.mutationFilter
          ? curr.filter((item) => {
              const value = `${
                item.options.mutationKey
                  ? JSON.stringify(item.options.mutationKey) + ' - '
                  : ''
              }${new Date(item.state.submittedAt).toLocaleString()}`
              return rankItem(value, props.localStore.mutationFilter || '')
                .passed
            })
          : [...curr]

        const sorted = mutationSortFn()
          ? filtered.sort(
              (a, b) => mutationSortFn()!(a, b) * mutationSortOrder(),
            )
          : filtered
        return sorted
      },
    ),
  )

  const setDevtoolsPosition = (pos: DevtoolsPosition) => {
    props.setLocalStore('position', pos)
  }

  // Sets the Font Size variable on portal menu elements since they will be outside
  // the main panel container
  const setComputedVariables = (el: HTMLDivElement) => {
    const computedStyle = getComputedStyle(containerRef)
    const variable = computedStyle.getPropertyValue('--tsqd-font-size')
    el.style.setProperty('--tsqd-font-size', variable)
  }
  return (
    <>
      <div
        // When the panels are stacked we use the height style
        // to divide the panels into two equal parts
        class={cx(
          styles().queriesContainer,
          panelWidth() < secondBreakpoint &&
            (selectedQueryHash() || selectedMutationId()) &&
            css`
              height: 50%;
              max-height: 50%;
            `,
          panelWidth() < secondBreakpoint &&
            !(selectedQueryHash() || selectedMutationId()) &&
            css`
              height: 100%;
              max-height: 100%;
            `,
          'tsqd-queries-container',
        )}
        ref={containerRef}
      >
        <div class={cx(styles().row, 'tsqd-header')}>
          <div class={styles().logoAndToggleContainer}>
            <button
              class={cx(styles().logo, 'tsqd-text-logo-container')}
              onClick={() => {
                if (!pip().pipWindow && !props.showPanelViewOnly) {
                  props.setLocalStore('open', 'false')
                  return
                }
                if (props.onClose) {
                  props.onClose()
                }
              }}
              aria-label="Close Tanstack query devtools"
            >
              <span
                class={cx(styles().tanstackLogo, 'tsqd-text-logo-tanstack')}
              >
                TANSTACK
              </span>
              <span
                class={cx(
                  styles().queryFlavorLogo,
                  'tsqd-text-logo-query-flavor',
                )}
              >
                {useQueryDevtoolsContext().queryFlavor} v
                {useQueryDevtoolsContext().version}
              </span>
            </button>
            <RadioGroup.Root
              class={cx(styles().viewToggle)}
              value={selectedView()}
              onChange={(value) => {
                setSelectedView(value as 'queries' | 'mutations')
                setSelectedQueryHash(null)
                setSelectedMutationId(null)
              }}
            >
              <RadioGroup.Item value="queries" class="tsqd-radio-toggle">
                <RadioGroup.ItemInput />
                <RadioGroup.ItemControl>
                  <RadioGroup.ItemIndicator />
                </RadioGroup.ItemControl>
                <RadioGroup.ItemLabel title="Toggle Queries View">
                  Queries
                </RadioGroup.ItemLabel>
              </RadioGroup.Item>
              <RadioGroup.Item value="mutations" class="tsqd-radio-toggle">
                <RadioGroup.ItemInput />
                <RadioGroup.ItemControl>
                  <RadioGroup.ItemIndicator />
                </RadioGroup.ItemControl>
                <RadioGroup.ItemLabel title="Toggle Mutations View">
                  Mutations
                </RadioGroup.ItemLabel>
              </RadioGroup.Item>
            </RadioGroup.Root>
          </div>

          <Show when={selectedView() === 'queries'}>
            <QueryStatusCount />
          </Show>
          <Show when={selectedView() === 'mutations'}>
            <MutationStatusCount />
          </Show>
        </div>
        <div class={cx(styles().row, 'tsqd-filters-actions-container')}>
          <div class={cx(styles().filtersContainer, 'tsqd-filters-container')}>
            <div
              class={cx(
                styles().filterInput,
                'tsqd-query-filter-textfield-container',
              )}
            >
              <Search />
              <input
                aria-label="Filter queries by query key"
                type="text"
                placeholder="Filter"
                onInput={(e) => {
                  if (selectedView() === 'queries') {
                    props.setLocalStore('filter', e.currentTarget.value)
                  } else {
                    props.setLocalStore('mutationFilter', e.currentTarget.value)
                  }
                }}
                class={cx('tsqd-query-filter-textfield')}
                name="tsqd-query-filter-input"
                value={
                  selectedView() === 'queries'
                    ? props.localStore.filter || ''
                    : props.localStore.mutationFilter || ''
                }
              />
            </div>
            <div
              class={cx(
                styles().filterSelect,
                'tsqd-query-filter-sort-container',
              )}
            >
              <Show when={selectedView() === 'queries'}>
                <select
                  value={sort()}
                  name="tsqd-queries-filter-sort"
                  onChange={(e) => {
                    props.setLocalStore('sort', e.currentTarget.value)
                  }}
                >
                  {Object.keys(sortFns).map((key) => (
                    <option value={key}>Sort by {key}</option>
                  ))}
                </select>
              </Show>
              <Show when={selectedView() === 'mutations'}>
                <select
                  value={mutationSort()}
                  name="tsqd-mutations-filter-sort"
                  onChange={(e) => {
                    props.setLocalStore('mutationSort', e.currentTarget.value)
                  }}
                >
                  {Object.keys(mutationSortFns).map((key) => (
                    <option value={key}>Sort by {key}</option>
                  ))}
                </select>
              </Show>
              <ChevronDown />
            </div>
            <button
              onClick={() => {
                if (selectedView() === 'queries') {
                  props.setLocalStore('sortOrder', String(sortOrder() * -1))
                } else {
                  props.setLocalStore(
                    'mutationSortOrder',
                    String(mutationSortOrder() * -1),
                  )
                }
              }}
              aria-label={`Sort order ${
                (selectedView() === 'queries'
                  ? sortOrder()
                  : mutationSortOrder()) === -1
                  ? 'descending'
                  : 'ascending'
              }`}
              aria-pressed={
                (selectedView() === 'queries'
                  ? sortOrder()
                  : mutationSortOrder()) === -1
              }
              class="tsqd-query-filter-sort-order-btn"
            >
              <Show
                when={
                  (selectedView() === 'queries'
                    ? sortOrder()
                    : mutationSortOrder()) === 1
                }
              >
                <span>Asc</span>
                <ArrowUp />
              </Show>
              <Show
                when={
                  (selectedView() === 'queries'
                    ? sortOrder()
                    : mutationSortOrder()) === -1
                }
              >
                <span>Desc</span>
                <ArrowDown />
              </Show>
            </button>
          </div>

          <div class={cx(styles().actionsContainer, 'tsqd-actions-container')}>
            <button
              onClick={() => {
                if (selectedView() === 'queries') {
                  sendDevToolsEvent({ type: 'CLEAR_QUERY_CACHE' })
                  query_cache().clear()
                } else {
                  sendDevToolsEvent({ type: 'CLEAR_MUTATION_CACHE' })
                  mutation_cache().clear()
                }
              }}
              class={cx(
                styles().actionsBtn,
                'tsqd-actions-btn',
                'tsqd-action-clear-cache',
              )}
              aria-label="Clear query cache"
              title={`Clear ${selectedView()} cache`}
            >
              <Trash />
            </button>
            <button
              onClick={() => {
                onlineManager().setOnline(!onlineManager().isOnline())
              }}
              class={cx(
                styles().actionsBtn,
                offline() && styles().actionsBtnOffline,
                'tsqd-actions-btn',
                'tsqd-action-mock-offline-behavior',
              )}
              aria-label={`${
                offline()
                  ? 'Unset offline mocking behavior'
                  : 'Mock offline behavior'
              }`}
              aria-pressed={offline()}
              title={`${
                offline()
                  ? 'Unset offline mocking behavior'
                  : 'Mock offline behavior'
              }`}
            >
              {offline() ? <Offline /> : <Wifi />}
            </button>
            <Show when={!pip().pipWindow && !pip().disabled}>
              <button
                onClick={() => {
                  pip().requestPipWindow(
                    Number(window.innerWidth),
                    Number(props.localStore.height ?? 500),
                  )
                }}
                class={cx(
                  styles().actionsBtn,
                  'tsqd-actions-btn',
                  'tsqd-action-open-pip',
                )}
                aria-label="Open in picture-in-picture mode"
                title={`Open in picture-in-picture mode`}
              >
                <PiPIcon />
              </button>
            </Show>

            <DropdownMenu.Root gutter={4}>
              <DropdownMenu.Trigger
                class={cx(
                  styles().actionsBtn,
                  'tsqd-actions-btn',
                  'tsqd-action-settings',
                )}
              >
                <Settings />
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal
                ref={(el) => setComputedVariables(el as HTMLDivElement)}
                mount={
                  pip().pipWindow
                    ? pip().pipWindow!.document.body
                    : document.body
                }
              >
                <DropdownMenu.Content
                  class={cx(styles().settingsMenu, 'tsqd-settings-menu')}
                >
                  <div
                    class={cx(
                      styles().settingsMenuHeader,
                      'tsqd-settings-menu-header',
                    )}
                  >
                    Settings
                  </div>
                  <Show when={!props.showPanelViewOnly}>
                    <DropdownMenu.Sub overlap gutter={8} shift={-4}>
                      <DropdownMenu.SubTrigger
                        class={cx(
                          styles().settingsSubTrigger,
                          'tsqd-settings-menu-sub-trigger',
                          'tsqd-settings-menu-sub-trigger-position',
                        )}
                      >
                        <span>Position</span>
                        <ChevronDown />
                      </DropdownMenu.SubTrigger>
                      <DropdownMenu.Portal
                        ref={(el) => setComputedVariables(el as HTMLDivElement)}
                        mount={
                          pip().pipWindow
                            ? pip().pipWindow!.document.body
                            : document.body
                        }
                      >
                        <DropdownMenu.SubContent
                          class={cx(
                            styles().settingsMenu,
                            'tsqd-settings-submenu',
                          )}
                        >
                          <DropdownMenu.Item
                            onSelect={() => {
                              setDevtoolsPosition('top')
                            }}
                            as="button"
                            class={cx(
                              styles().settingsSubButton,
                              'tsqd-settings-menu-position-btn',
                              'tsqd-settings-menu-position-btn-top',
                            )}
                          >
                            <span>Top</span>
                            <ArrowUp />
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            onSelect={() => {
                              setDevtoolsPosition('bottom')
                            }}
                            as="button"
                            class={cx(
                              styles().settingsSubButton,
                              'tsqd-settings-menu-position-btn',
                              'tsqd-settings-menu-position-btn-bottom',
                            )}
                          >
                            <span>Bottom</span>
                            <ArrowDown />
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            onSelect={() => {
                              setDevtoolsPosition('left')
                            }}
                            as="button"
                            class={cx(
                              styles().settingsSubButton,
                              'tsqd-settings-menu-position-btn',
                              'tsqd-settings-menu-position-btn-left',
                            )}
                          >
                            <span>Left</span>
                            <ArrowLeft />
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            onSelect={() => {
                              setDevtoolsPosition('right')
                            }}
                            as="button"
                            class={cx(
                              styles().settingsSubButton,
                              'tsqd-settings-menu-position-btn',
                              'tsqd-settings-menu-position-btn-right',
                            )}
                          >
                            <span>Right</span>
                            <ArrowRight />
                          </DropdownMenu.Item>
                        </DropdownMenu.SubContent>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Sub>
                  </Show>
                  <DropdownMenu.Sub overlap gutter={8} shift={-4}>
                    <DropdownMenu.SubTrigger
                      class={cx(
                        styles().settingsSubTrigger,
                        'tsqd-settings-menu-sub-trigger',
                        'tsqd-settings-menu-sub-trigger-position',
                      )}
                    >
                      <span>Theme</span>
                      <ChevronDown />
                    </DropdownMenu.SubTrigger>
                    <DropdownMenu.Portal
                      ref={(el) => setComputedVariables(el as HTMLDivElement)}
                      mount={
                        pip().pipWindow
                          ? pip().pipWindow!.document.body
                          : document.body
                      }
                    >
                      <DropdownMenu.SubContent
                        class={cx(
                          styles().settingsMenu,
                          'tsqd-settings-submenu',
                        )}
                      >
                        <DropdownMenu.Item
                          onSelect={() => {
                            props.setLocalStore('theme_preference', 'light')
                          }}
                          as="button"
                          class={cx(
                            styles().settingsSubButton,
                            props.localStore.theme_preference === 'light' &&
                              styles().themeSelectedButton,
                            'tsqd-settings-menu-position-btn',
                            'tsqd-settings-menu-position-btn-top',
                          )}
                        >
                          <span>Light</span>
                          <Sun />
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onSelect={() => {
                            props.setLocalStore('theme_preference', 'dark')
                          }}
                          as="button"
                          class={cx(
                            styles().settingsSubButton,
                            props.localStore.theme_preference === 'dark' &&
                              styles().themeSelectedButton,
                            'tsqd-settings-menu-position-btn',
                            'tsqd-settings-menu-position-btn-bottom',
                          )}
                        >
                          <span>Dark</span>
                          <Moon />
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onSelect={() => {
                            props.setLocalStore('theme_preference', 'system')
                          }}
                          as="button"
                          class={cx(
                            styles().settingsSubButton,
                            props.localStore.theme_preference === 'system' &&
                              styles().themeSelectedButton,
                            'tsqd-settings-menu-position-btn',
                            'tsqd-settings-menu-position-btn-left',
                          )}
                        >
                          <span>System</span>
                          <Monitor />
                        </DropdownMenu.Item>
                      </DropdownMenu.SubContent>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Sub>
                  <DropdownMenu.Sub overlap gutter={8} shift={-4}>
                    <DropdownMenu.SubTrigger
                      class={cx(
                        styles().settingsSubTrigger,
                        'tsqd-settings-menu-sub-trigger',
                        'tsqd-settings-menu-sub-trigger-disabled-queries',
                      )}
                    >
                      <span>Disabled Queries</span>
                      <ChevronDown />
                    </DropdownMenu.SubTrigger>
                    <DropdownMenu.Portal
                      ref={(el) => setComputedVariables(el as HTMLDivElement)}
                      mount={
                        pip().pipWindow
                          ? pip().pipWindow!.document.body
                          : document.body
                      }
                    >
                      <DropdownMenu.SubContent
                        class={cx(
                          styles().settingsMenu,
                          'tsqd-settings-submenu',
                        )}
                      >
                        <DropdownMenu.Item
                          onSelect={() => {
                            props.setLocalStore('hideDisabledQueries', 'false')
                          }}
                          as="button"
                          class={cx(
                            styles().settingsSubButton,
                            props.localStore.hideDisabledQueries !== 'true' &&
                              styles().themeSelectedButton,
                            'tsqd-settings-menu-position-btn',
                            'tsqd-settings-menu-position-btn-show',
                          )}
                        >
                          <span>Show</span>
                          <Show
                            when={
                              props.localStore.hideDisabledQueries !== 'true'
                            }
                          >
                            <CheckCircle />
                          </Show>
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onSelect={() => {
                            props.setLocalStore('hideDisabledQueries', 'true')
                          }}
                          as="button"
                          class={cx(
                            styles().settingsSubButton,
                            props.localStore.hideDisabledQueries === 'true' &&
                              styles().themeSelectedButton,
                            'tsqd-settings-menu-position-btn',
                            'tsqd-settings-menu-position-btn-hide',
                          )}
                        >
                          <span>Hide</span>
                          <Show
                            when={
                              props.localStore.hideDisabledQueries === 'true'
                            }
                          >
                            <CheckCircle />
                          </Show>
                        </DropdownMenu.Item>
                      </DropdownMenu.SubContent>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Sub>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
        <Show when={selectedView() === 'queries'}>
          <div
            class={cx(
              styles().overflowQueryContainer,
              'tsqd-queries-overflow-container',
            )}
          >
            <div class="tsqd-queries-container">
              <Key by={(q) => q.queryHash} each={queries()}>
                {(query) => <QueryRow query={query()} />}
              </Key>
            </div>
          </div>
        </Show>
        <Show when={selectedView() === 'mutations'}>
          <div
            class={cx(
              styles().overflowQueryContainer,
              'tsqd-mutations-overflow-container',
            )}
          >
            <div class="tsqd-mutations-container">
              <Key by={(m) => m.mutationId} each={mutations()}>
                {(mutation) => <MutationRow mutation={mutation()} />}
              </Key>
            </div>
          </div>
        </Show>
      </div>
      <Show when={selectedView() === 'queries' && selectedQueryHash()}>
        <QueryDetails />
      </Show>

      <Show when={selectedView() === 'mutations' && selectedMutationId()}>
        <MutationDetails />
      </Show>
    </>
  )
}

const QueryRow: Component<{ query: Query }> = (props) => {
  const theme = useTheme()
  const css = useQueryDevtoolsContext().shadowDOMTarget
    ? goober.css.bind({ target: useQueryDevtoolsContext().shadowDOMTarget })
    : goober.css
  const styles = createMemo(() => {
    return theme() === 'dark' ? darkStyles(css) : lightStyles(css)
  })

  const { colors, alpha } = tokens
  const t = (light: string, dark: string) => (theme() === 'dark' ? dark : light)

  const queryState = createSubscribeToQueryCacheBatcher(
    (queryCache) =>
      queryCache().find({
        queryKey: props.query.queryKey,
      })?.state,
    true,
    (e) => e.query.queryHash === props.query.queryHash,
  )

  const isDisabled = createSubscribeToQueryCacheBatcher(
    (queryCache) =>
      queryCache()
        .find({
          queryKey: props.query.queryKey,
        })
        ?.isDisabled() ?? false,
    true,
    (e) => e.query.queryHash === props.query.queryHash,
  )

  const isStatic = createSubscribeToQueryCacheBatcher(
    (queryCache) =>
      queryCache()
        .find({
          queryKey: props.query.queryKey,
        })
        ?.isStatic() ?? false,
    true,
    (e) => e.query.queryHash === props.query.queryHash,
  )

  const isStale = createSubscribeToQueryCacheBatcher(
    (queryCache) =>
      queryCache()
        .find({
          queryKey: props.query.queryKey,
        })
        ?.isStale() ?? false,
    true,
    (e) => e.query.queryHash === props.query.queryHash,
  )

  const observers = createSubscribeToQueryCacheBatcher(
    (queryCache) =>
      queryCache()
        .find({
          queryKey: props.query.queryKey,
        })
        ?.getObserversCount() ?? 0,
    true,
    (e) => e.query.queryHash === props.query.queryHash,
  )

  const color = createMemo(() =>
    getQueryStatusColor({
      queryState: queryState()!,
      observerCount: observers(),
      isStale: isStale(),
    }),
  )

  const getObserverCountColorStyles = () => {
    if (color() === 'gray') {
      return css`
        background-color: ${t(colors[color()][200], colors[color()][700])};
        color: ${t(colors[color()][700], colors[color()][300])};
      `
    }

    return css`
      background-color: ${t(
        colors[color()][200] + alpha[80],
        colors[color()][900],
      )};
      color: ${t(colors[color()][800], colors[color()][300])};
    `
  }

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
          styles().queryRow,
          selectedQueryHash() === props.query.queryHash &&
            styles().selectedQueryRow,
          'tsqd-query-row',
        )}
        aria-label={`Query key ${props.query.queryHash}`}
      >
        <div
          class={cx(getObserverCountColorStyles(), 'tsqd-query-observer-count')}
        >
          {observers()}
        </div>
        <code class="tsqd-query-hash">{props.query.queryHash}</code>
        <Show when={isDisabled()}>
          <div class="tsqd-query-disabled-indicator">disabled</div>
        </Show>
        <Show when={isStatic()}>
          <div class="tsqd-query-static-indicator">static</div>
        </Show>
      </button>
    </Show>
  )
}

const MutationRow: Component<{ mutation: Mutation }> = (props) => {
  const theme = useTheme()
  const css = useQueryDevtoolsContext().shadowDOMTarget
    ? goober.css.bind({ target: useQueryDevtoolsContext().shadowDOMTarget })
    : goober.css
  const styles = createMemo(() => {
    return theme() === 'dark' ? darkStyles(css) : lightStyles(css)
  })

  const { colors, alpha } = tokens
  const t = (light: string, dark: string) => (theme() === 'dark' ? dark : light)

  const mutationState = createSubscribeToMutationCacheBatcher(
    (mutationCache) => {
      const mutations = mutationCache().getAll()
      const mutation = mutations.find(
        (m) => m.mutationId === props.mutation.mutationId,
      )
      return mutation?.state
    },
  )

  const isPaused = createSubscribeToMutationCacheBatcher((mutationCache) => {
    const mutations = mutationCache().getAll()
    const mutation = mutations.find(
      (m) => m.mutationId === props.mutation.mutationId,
    )
    if (!mutation) return false
    return mutation.state.isPaused
  })

  const status = createSubscribeToMutationCacheBatcher((mutationCache) => {
    const mutations = mutationCache().getAll()
    const mutation = mutations.find(
      (m) => m.mutationId === props.mutation.mutationId,
    )
    if (!mutation) return 'idle'
    return mutation.state.status
  })

  const color = createMemo(() =>
    getMutationStatusColor({
      isPaused: isPaused(),
      status: status(),
    }),
  )

  const getObserverCountColorStyles = () => {
    if (color() === 'gray') {
      return css`
        background-color: ${t(colors[color()][200], colors[color()][700])};
        color: ${t(colors[color()][700], colors[color()][300])};
      `
    }

    return css`
      background-color: ${t(
        colors[color()][200] + alpha[80],
        colors[color()][900],
      )};
      color: ${t(colors[color()][800], colors[color()][300])};
    `
  }

  return (
    <Show when={mutationState()}>
      <button
        onClick={() => {
          setSelectedMutationId(
            props.mutation.mutationId === selectedMutationId()
              ? null
              : props.mutation.mutationId,
          )
        }}
        class={cx(
          styles().queryRow,
          selectedMutationId() === props.mutation.mutationId &&
            styles().selectedQueryRow,
          'tsqd-query-row',
        )}
        aria-label={`Mutation submitted at ${new Date(
          props.mutation.state.submittedAt,
        ).toLocaleString()}`}
      >
        <div
          class={cx(getObserverCountColorStyles(), 'tsqd-query-observer-count')}
        >
          <Show when={color() === 'purple'}>
            <PauseCircle />
          </Show>
          <Show when={color() === 'green'}>
            <CheckCircle />
          </Show>
          <Show when={color() === 'red'}>
            <XCircle />
          </Show>
          <Show when={color() === 'yellow'}>
            <LoadingCircle />
          </Show>
        </div>
        <code class="tsqd-query-hash">
          <Show when={props.mutation.options.mutationKey}>
            {JSON.stringify(props.mutation.options.mutationKey)} -{' '}
          </Show>
          {new Date(props.mutation.state.submittedAt).toLocaleString()}
        </code>
      </button>
    </Show>
  )
}

const QueryStatusCount: Component = () => {
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

  const theme = useTheme()
  const css = useQueryDevtoolsContext().shadowDOMTarget
    ? goober.css.bind({ target: useQueryDevtoolsContext().shadowDOMTarget })
    : goober.css
  const styles = createMemo(() => {
    return theme() === 'dark' ? darkStyles(css) : lightStyles(css)
  })

  return (
    <div
      class={cx(styles().queryStatusContainer, 'tsqd-query-status-container')}
    >
      <QueryStatus label="Fresh" color="green" count={fresh()} />
      <QueryStatus label="Fetching" color="blue" count={fetching()} />
      <QueryStatus label="Paused" color="purple" count={paused()} />
      <QueryStatus label="Stale" color="yellow" count={stale()} />
      <QueryStatus label="Inactive" color="gray" count={inactive()} />
    </div>
  )
}

const MutationStatusCount: Component = () => {
  const success = createSubscribeToMutationCacheBatcher(
    (mutationCache) =>
      mutationCache()
        .getAll()
        .filter(
          (m) =>
            getMutationStatusColor({
              isPaused: m.state.isPaused,
              status: m.state.status,
            }) === 'green',
        ).length,
  )

  const pending = createSubscribeToMutationCacheBatcher(
    (mutationCache) =>
      mutationCache()
        .getAll()
        .filter(
          (m) =>
            getMutationStatusColor({
              isPaused: m.state.isPaused,
              status: m.state.status,
            }) === 'yellow',
        ).length,
  )

  const paused = createSubscribeToMutationCacheBatcher(
    (mutationCache) =>
      mutationCache()
        .getAll()
        .filter(
          (m) =>
            getMutationStatusColor({
              isPaused: m.state.isPaused,
              status: m.state.status,
            }) === 'purple',
        ).length,
  )

  const error = createSubscribeToMutationCacheBatcher(
    (mutationCache) =>
      mutationCache()
        .getAll()
        .filter(
          (m) =>
            getMutationStatusColor({
              isPaused: m.state.isPaused,
              status: m.state.status,
            }) === 'red',
        ).length,
  )

  const theme = useTheme()
  const css = useQueryDevtoolsContext().shadowDOMTarget
    ? goober.css.bind({ target: useQueryDevtoolsContext().shadowDOMTarget })
    : goober.css
  const styles = createMemo(() => {
    return theme() === 'dark' ? darkStyles(css) : lightStyles(css)
  })

  return (
    <div
      class={cx(styles().queryStatusContainer, 'tsqd-query-status-container')}
    >
      <QueryStatus label="Paused" color="purple" count={paused()} />
      <QueryStatus label="Pending" color="yellow" count={pending()} />
      <QueryStatus label="Success" color="green" count={success()} />
      <QueryStatus label="Error" color="red" count={error()} />
    </div>
  )
}

const QueryStatus: Component<QueryStatusProps> = (props) => {
  const theme = useTheme()
  const css = useQueryDevtoolsContext().shadowDOMTarget
    ? goober.css.bind({ target: useQueryDevtoolsContext().shadowDOMTarget })
    : goober.css
  const styles = createMemo(() => {
    return theme() === 'dark' ? darkStyles(css) : lightStyles(css)
  })

  const { colors, alpha } = tokens
  const t = (light: string, dark: string) => (theme() === 'dark' ? dark : light)

  let tagRef!: HTMLButtonElement

  const [mouseOver, setMouseOver] = createSignal(false)
  const [focused, setFocused] = createSignal(false)

  const showLabel = createMemo(() => {
    if (selectedQueryHash()) {
      if (panelWidth() < firstBreakpoint && panelWidth() > secondBreakpoint) {
        return false
      }
    }
    if (panelWidth() < secondBreakpoint) {
      return false
    }

    return true
  })

  return (
    <button
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onMouseEnter={() => setMouseOver(true)}
      onMouseLeave={() => {
        setMouseOver(false)
        setFocused(false)
      }}
      disabled={showLabel()}
      ref={tagRef}
      class={cx(
        styles().queryStatusTag,
        !showLabel() &&
          css`
            cursor: pointer;
            &:hover {
              background: ${t(
                  colors.gray[200],
                  colors.darkGray[400],
                )}${alpha[80]};
            }
          `,
        'tsqd-query-status-tag',
        `tsqd-query-status-tag-${props.label.toLowerCase()}`,
      )}
      {...(mouseOver() || focused()
        ? {
            'aria-describedby': 'tsqd-status-tooltip',
          }
        : {})}
    >
      <Show when={!showLabel() && (mouseOver() || focused())}>
        <div
          role="tooltip"
          id="tsqd-status-tooltip"
          class={cx(styles().statusTooltip, 'tsqd-query-status-tooltip')}
        >
          {props.label}
        </div>
      </Show>
      <span
        class={cx(
          css`
            width: ${tokens.size[1.5]};
            height: ${tokens.size[1.5]};
            border-radius: ${tokens.border.radius.full};
            background-color: ${tokens.colors[props.color][500]};
          `,
          'tsqd-query-status-tag-dot',
        )}
      />
      <Show when={showLabel()}>
        <span
          class={cx(
            styles().queryStatusTagLabel,
            'tsqd-query-status-tag-label',
          )}
        >
          {props.label}
        </span>
      </Show>
      <span
        class={cx(
          styles().queryStatusCount,
          props.count > 0 &&
            props.color !== 'gray' &&
            css`
              background-color: ${t(
                colors[props.color][100],
                colors[props.color][900],
              )};
              color: ${t(colors[props.color][700], colors[props.color][300])};
            `,
          'tsqd-query-status-tag-count',
        )}
      >
        {props.count}
      </span>
    </button>
  )
}

const QueryDetails = () => {
  const theme = useTheme()
  const css = useQueryDevtoolsContext().shadowDOMTarget
    ? goober.css.bind({ target: useQueryDevtoolsContext().shadowDOMTarget })
    : goober.css
  const styles = createMemo(() => {
    return theme() === 'dark' ? darkStyles(css) : lightStyles(css)
  })

  const { colors } = tokens
  const t = (light: string, dark: string) => (theme() === 'dark' ? dark : light)

  const queryClient = useQueryDevtoolsContext().client

  const [restoringLoading, setRestoringLoading] = createSignal(false)
  const [dataMode, setDataMode] = createSignal<'view' | 'edit'>('view')
  const [dataEditError, setDataEditError] = createSignal<boolean>(false)

  const errorTypes = createMemo(() => {
    return useQueryDevtoolsContext().errorTypes || []
  })

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
    sendDevToolsEvent({ type: 'REFETCH', queryHash: activeQuery()?.queryHash })
    const promise = activeQuery()?.fetch()
    promise?.catch(() => {})
  }

  const triggerError = (errorType?: DevtoolsErrorType) => {
    const activeQueryVal = activeQuery()
    if (!activeQueryVal) return
    sendDevToolsEvent({
      type: 'TRIGGER_ERROR',
      queryHash: activeQueryVal.queryHash,
      metadata: { error: errorType?.name },
    })
    const error =
      errorType?.initializer(activeQueryVal) ??
      new Error('Unknown error from devtools')

    const __previousQueryOptions = activeQueryVal.options

    activeQueryVal.setState({
      status: 'error',
      error,
      fetchMeta: {
        ...activeQueryVal.state.fetchMeta,
        __previousQueryOptions,
      } as any,
    } as QueryState<unknown, Error>)
  }

  const restoreQueryAfterLoadingOrError = () => {
    const activeQueryVal = activeQuery()
    if (!activeQueryVal) return

    sendDevToolsEvent({
      type: 'RESTORE_LOADING',
      queryHash: activeQueryVal.queryHash,
    })
    const previousState = activeQueryVal.state
    const previousOptions = activeQueryVal.state.fetchMeta
      ? (activeQueryVal.state.fetchMeta as any).__previousQueryOptions
      : null

    activeQueryVal.cancel({ silent: true })
    activeQueryVal.setState({
      ...previousState,
      fetchStatus: 'idle',
      fetchMeta: null,
    })

    if (previousOptions) {
      activeQueryVal.fetch(previousOptions)
    }
  }

  createEffect(() => {
    if (statusLabel() !== 'fetching') {
      setRestoringLoading(false)
    }
  })

  const getQueryStatusColors = () => {
    if (color() === 'gray') {
      return css`
        background-color: ${t(colors[color()][200], colors[color()][700])};
        color: ${t(colors[color()][700], colors[color()][300])};
        border-color: ${t(colors[color()][400], colors[color()][600])};
      `
    }
    return css`
      background-color: ${t(colors[color()][100], colors[color()][900])};
      color: ${t(colors[color()][700], colors[color()][300])};
      border-color: ${t(colors[color()][400], colors[color()][600])};
    `
  }

  return (
    <Show when={activeQuery() && activeQueryState()}>
      <div
        class={cx(styles().detailsContainer, 'tsqd-query-details-container')}
      >
        <div class={cx(styles().detailsHeader, 'tsqd-query-details-header')}>
          Query Details
        </div>
        <div
          class={cx(
            styles().detailsBody,
            'tsqd-query-details-summary-container',
          )}
        >
          <div class="tsqd-query-details-summary">
            <pre>
              <code>{displayValue(activeQuery()!.queryKey, true)}</code>
            </pre>
            <span
              class={cx(styles().queryDetailsStatus, getQueryStatusColors())}
            >
              {statusLabel()}
            </span>
          </div>
          <div class="tsqd-query-details-observers-count">
            <span>Observers:</span>
            <span>{observerCount()}</span>
          </div>
          <div class="tsqd-query-details-last-updated">
            <span>Last Updated:</span>
            <span>
              {new Date(activeQueryState()!.dataUpdatedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
        <div class={cx(styles().detailsHeader, 'tsqd-query-details-header')}>
          Actions
        </div>
        <div
          class={cx(
            styles().actionsBody,
            'tsqd-query-details-actions-container',
          )}
        >
          <button
            class={cx(
              css`
                color: ${t(colors.blue[600], colors.blue[400])};
              `,
              'tsqd-query-details-actions-btn',
              'tsqd-query-details-action-refetch',
            )}
            onClick={handleRefetch}
            disabled={statusLabel() === 'fetching'}
          >
            <span
              class={css`
                background-color: ${t(colors.blue[600], colors.blue[400])};
              `}
            ></span>
            Refetch
          </button>
          <button
            class={cx(
              css`
                color: ${t(colors.yellow[600], colors.yellow[400])};
              `,
              'tsqd-query-details-actions-btn',
              'tsqd-query-details-action-invalidate',
            )}
            onClick={() => {
              sendDevToolsEvent({
                type: 'INVALIDATE',
                queryHash: activeQuery()?.queryHash,
              })
              queryClient.invalidateQueries(activeQuery())
            }}
            disabled={queryStatus() === 'pending'}
          >
            <span
              class={css`
                background-color: ${t(colors.yellow[600], colors.yellow[400])};
              `}
            ></span>
            Invalidate
          </button>
          <button
            class={cx(
              css`
                color: ${t(colors.gray[600], colors.gray[300])};
              `,
              'tsqd-query-details-actions-btn',
              'tsqd-query-details-action-reset',
            )}
            onClick={() => {
              sendDevToolsEvent({
                type: 'RESET',
                queryHash: activeQuery()?.queryHash,
              })
              queryClient.resetQueries(activeQuery())
            }}
            disabled={queryStatus() === 'pending'}
          >
            <span
              class={css`
                background-color: ${t(colors.gray[600], colors.gray[400])};
              `}
            ></span>
            Reset
          </button>
          <button
            class={cx(
              css`
                color: ${t(colors.pink[500], colors.pink[400])};
              `,
              'tsqd-query-details-actions-btn',
              'tsqd-query-details-action-remove',
            )}
            onClick={() => {
              sendDevToolsEvent({
                type: 'REMOVE',
                queryHash: activeQuery()?.queryHash,
              })
              queryClient.removeQueries(activeQuery())
              setSelectedQueryHash(null)
            }}
            disabled={statusLabel() === 'fetching'}
          >
            <span
              class={css`
                background-color: ${t(colors.pink[500], colors.pink[400])};
              `}
            ></span>
            Remove
          </button>
          <button
            class={cx(
              css`
                color: ${t(colors.cyan[500], colors.cyan[400])};
              `,
              'tsqd-query-details-actions-btn',
              'tsqd-query-details-action-loading',
            )}
            disabled={restoringLoading()}
            onClick={() => {
              if (activeQuery()?.state.data === undefined) {
                setRestoringLoading(true)
                restoreQueryAfterLoadingOrError()
              } else {
                const activeQueryVal = activeQuery()
                if (!activeQueryVal) return
                sendDevToolsEvent({
                  type: 'TRIGGER_LOADING',
                  queryHash: activeQueryVal.queryHash,
                })
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
                background-color: ${t(colors.cyan[500], colors.cyan[400])};
              `}
            ></span>
            {queryStatus() === 'pending' ? 'Restore' : 'Trigger'} Loading
          </button>
          <Show when={errorTypes().length === 0 || queryStatus() === 'error'}>
            <button
              class={cx(
                css`
                  color: ${t(colors.red[500], colors.red[400])};
                `,
                'tsqd-query-details-actions-btn',
                'tsqd-query-details-action-error',
              )}
              onClick={() => {
                if (!activeQuery()!.state.error) {
                  triggerError()
                } else {
                  sendDevToolsEvent({
                    type: 'RESTORE_ERROR',
                    queryHash: activeQuery()?.queryHash,
                  })
                  queryClient.resetQueries(activeQuery())
                }
              }}
              disabled={queryStatus() === 'pending'}
            >
              <span
                class={css`
                  background-color: ${t(colors.red[500], colors.red[400])};
                `}
              ></span>
              {queryStatus() === 'error' ? 'Restore' : 'Trigger'} Error
            </button>
          </Show>
          <Show
            when={!(errorTypes().length === 0 || queryStatus() === 'error')}
          >
            <div
              class={cx(
                styles().actionsSelect,
                'tsqd-query-details-actions-btn',
                'tsqd-query-details-action-error-multiple',
              )}
            >
              <span
                class={css`
                  background-color: ${tokens.colors.red[400]};
                `}
              ></span>
              Trigger Error
              <select
                disabled={queryStatus() === 'pending'}
                onChange={(e) => {
                  const errorType = errorTypes().find(
                    (et) => et.name === e.currentTarget.value,
                  )

                  triggerError(errorType)
                }}
              >
                <option value="" disabled selected></option>
                <For each={errorTypes()}>
                  {(errorType) => (
                    <option value={errorType.name}>{errorType.name}</option>
                  )}
                </For>
              </select>
              <ChevronDown />
            </div>
          </Show>
        </div>
        <div class={cx(styles().detailsHeader, 'tsqd-query-details-header')}>
          Data {dataMode() === 'view' ? 'Explorer' : 'Editor'}
        </div>
        <Show when={dataMode() === 'view'}>
          <div
            style={{
              padding: tokens.size[2],
            }}
            class="tsqd-query-details-explorer-container tsqd-query-details-data-explorer"
          >
            <Explorer
              label="Data"
              defaultExpanded={['Data']}
              value={activeQueryStateData()}
              editable={true}
              onEdit={() => setDataMode('edit')}
              activeQuery={activeQuery()}
            />
          </div>
        </Show>
        <Show when={dataMode() === 'edit'}>
          <form
            class={cx(
              styles().devtoolsEditForm,
              'tsqd-query-details-data-editor',
            )}
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const data = formData.get('data') as string
              try {
                const parsedData = JSON.parse(data)
                activeQuery()!.setState({
                  ...activeQuery()!.state,
                  data: parsedData,
                })
                setDataMode('view')
              } catch (error) {
                setDataEditError(true)
              }
            }}
          >
            <textarea
              name="data"
              class={styles().devtoolsEditTextarea}
              onFocus={() => setDataEditError(false)}
              data-error={dataEditError()}
              value={JSON.stringify(activeQueryStateData(), null, 2)}
            ></textarea>
            <div class={styles().devtoolsEditFormActions}>
              <span class={styles().devtoolsEditFormError}>
                {dataEditError() ? 'Invalid Value' : ''}
              </span>
              <div class={styles().devtoolsEditFormActionContainer}>
                <button
                  class={cx(
                    styles().devtoolsEditFormAction,
                    css`
                      color: ${t(colors.gray[600], colors.gray[300])};
                    `,
                  )}
                  type="button"
                  onClick={() => setDataMode('view')}
                >
                  Cancel
                </button>
                <button
                  class={cx(
                    styles().devtoolsEditFormAction,
                    css`
                      color: ${t(colors.blue[600], colors.blue[400])};
                    `,
                  )}
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        </Show>
        <div class={cx(styles().detailsHeader, 'tsqd-query-details-header')}>
          Query Explorer
        </div>
        <div
          style={{
            padding: tokens.size[2],
          }}
          class="tsqd-query-details-explorer-container tsqd-query-details-query-explorer"
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

const MutationDetails = () => {
  const theme = useTheme()
  const css = useQueryDevtoolsContext().shadowDOMTarget
    ? goober.css.bind({ target: useQueryDevtoolsContext().shadowDOMTarget })
    : goober.css
  const styles = createMemo(() => {
    return theme() === 'dark' ? darkStyles(css) : lightStyles(css)
  })

  const { colors } = tokens
  const t = (light: string, dark: string) => (theme() === 'dark' ? dark : light)

  const isPaused = createSubscribeToMutationCacheBatcher((mutationCache) => {
    const mutations = mutationCache().getAll()
    const mutation = mutations.find(
      (m) => m.mutationId === selectedMutationId(),
    )
    if (!mutation) return false
    return mutation.state.isPaused
  })

  const status = createSubscribeToMutationCacheBatcher((mutationCache) => {
    const mutations = mutationCache().getAll()
    const mutation = mutations.find(
      (m) => m.mutationId === selectedMutationId(),
    )
    if (!mutation) return 'idle'
    return mutation.state.status
  })

  const color = createMemo(() =>
    getMutationStatusColor({
      isPaused: isPaused(),
      status: status(),
    }),
  )

  const activeMutation = createSubscribeToMutationCacheBatcher(
    (mutationCache) =>
      mutationCache()
        .getAll()
        .find((mutation) => mutation.mutationId === selectedMutationId()),
    false,
  )

  const getQueryStatusColors = () => {
    if (color() === 'gray') {
      return css`
        background-color: ${t(colors[color()][200], colors[color()][700])};
        color: ${t(colors[color()][700], colors[color()][300])};
        border-color: ${t(colors[color()][400], colors[color()][600])};
      `
    }
    return css`
      background-color: ${t(colors[color()][100], colors[color()][900])};
      color: ${t(colors[color()][700], colors[color()][300])};
      border-color: ${t(colors[color()][400], colors[color()][600])};
    `
  }

  return (
    <Show when={activeMutation()}>
      <div
        class={cx(styles().detailsContainer, 'tsqd-query-details-container')}
      >
        <div class={cx(styles().detailsHeader, 'tsqd-query-details-header')}>
          Mutation Details
        </div>
        <div
          class={cx(
            styles().detailsBody,
            'tsqd-query-details-summary-container',
          )}
        >
          <div class="tsqd-query-details-summary">
            <pre>
              <code>
                <Show
                  when={activeMutation()!.options.mutationKey}
                  fallback={'No mutationKey found'}
                >
                  {displayValue(activeMutation()!.options.mutationKey, true)}
                </Show>
              </code>
            </pre>
            <span
              class={cx(styles().queryDetailsStatus, getQueryStatusColors())}
            >
              <Show when={color() === 'purple'}>pending</Show>
              <Show when={color() !== 'purple'}>{status()}</Show>
            </span>
          </div>
          <div class="tsqd-query-details-last-updated">
            <span>Submitted At:</span>
            <span>
              {new Date(
                activeMutation()!.state.submittedAt,
              ).toLocaleTimeString()}
            </span>
          </div>
        </div>
        <div class={cx(styles().detailsHeader, 'tsqd-query-details-header')}>
          Variables Details
        </div>
        <div
          style={{
            padding: tokens.size[2],
          }}
          class="tsqd-query-details-explorer-container tsqd-query-details-query-explorer"
        >
          <Explorer
            label="Variables"
            defaultExpanded={['Variables']}
            value={activeMutation()!.state.variables}
          />
        </div>
        <div class={cx(styles().detailsHeader, 'tsqd-query-details-header')}>
          Context Details
        </div>
        <div
          style={{
            padding: tokens.size[2],
          }}
          class="tsqd-query-details-explorer-container tsqd-query-details-query-explorer"
        >
          <Explorer
            label="Context"
            defaultExpanded={['Context']}
            value={activeMutation()!.state.context}
          />
        </div>
        <div class={cx(styles().detailsHeader, 'tsqd-query-details-header')}>
          Data Explorer
        </div>
        <div
          style={{
            padding: tokens.size[2],
          }}
          class="tsqd-query-details-explorer-container tsqd-query-details-query-explorer"
        >
          <Explorer
            label="Data"
            defaultExpanded={['Data']}
            value={activeMutation()!.state.data}
          />
        </div>
        <div class={cx(styles().detailsHeader, 'tsqd-query-details-header')}>
          Mutations Explorer
        </div>
        <div
          style={{
            padding: tokens.size[2],
          }}
          class="tsqd-query-details-explorer-container tsqd-query-details-query-explorer"
        >
          <Explorer
            label="Mutation"
            defaultExpanded={['Mutation']}
            value={activeMutation()}
          />
        </div>
      </div>
    </Show>
  )
}

const queryCacheMap = new Map<
  (q: Accessor<QueryCache>) => any,
  {
    setter: Setter<any>
    shouldUpdate: (event: QueryCacheNotifyEvent) => boolean
  }
>()

const setupQueryCacheSubscription = () => {
  const queryCache = createMemo(() => {
    const client = useQueryDevtoolsContext().client
    return client.getQueryCache()
  })

  const unsubscribe = queryCache().subscribe((q) => {
    batch(() => {
      for (const [callback, value] of queryCacheMap.entries()) {
        if (!value.shouldUpdate(q)) continue
        value.setter(callback(queryCache))
      }
    })
  })

  onCleanup(() => {
    queryCacheMap.clear()
    unsubscribe()
  })

  return unsubscribe
}

const createSubscribeToQueryCacheBatcher = <T,>(
  callback: (queryCache: Accessor<QueryCache>) => Exclude<T, Function>,
  equalityCheck: boolean = true,
  shouldUpdate: (event: QueryCacheNotifyEvent) => boolean = () => true,
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

  queryCacheMap.set(callback, {
    setter: setValue,
    shouldUpdate: shouldUpdate,
  })

  onCleanup(() => {
    queryCacheMap.delete(callback)
  })

  return value
}

const mutationCacheMap = new Map<
  (q: Accessor<MutationCache>) => any,
  Setter<any>
>()

const setupMutationCacheSubscription = () => {
  const mutationCache = createMemo(() => {
    const client = useQueryDevtoolsContext().client
    return client.getMutationCache()
  })

  const unsubscribe = mutationCache().subscribe(() => {
    for (const [callback, setter] of mutationCacheMap.entries()) {
      queueMicrotask(() => {
        setter(callback(mutationCache))
      })
    }
  })

  onCleanup(() => {
    mutationCacheMap.clear()
    unsubscribe()
  })

  return unsubscribe
}

const createSubscribeToMutationCacheBatcher = <T,>(
  callback: (queryCache: Accessor<MutationCache>) => Exclude<T, Function>,
  equalityCheck: boolean = true,
) => {
  const mutationCache = createMemo(() => {
    const client = useQueryDevtoolsContext().client
    return client.getMutationCache()
  })

  const [value, setValue] = createSignal<T>(
    callback(mutationCache),
    !equalityCheck ? { equals: false } : undefined,
  )

  createEffect(() => {
    setValue(callback(mutationCache))
  })

  mutationCacheMap.set(callback, setValue)

  onCleanup(() => {
    mutationCacheMap.delete(callback)
  })

  return value
}

type DevToolsActionType =
  | 'REFETCH'
  | 'INVALIDATE'
  | 'RESET'
  | 'REMOVE'
  | 'TRIGGER_ERROR'
  | 'RESTORE_ERROR'
  | 'TRIGGER_LOADING'
  | 'RESTORE_LOADING'
  | 'CLEAR_MUTATION_CACHE'
  | 'CLEAR_QUERY_CACHE'

const DEV_TOOLS_EVENT = '@tanstack/query-devtools-event'

const sendDevToolsEvent = ({
  type,
  queryHash,
  metadata,
}: {
  type: DevToolsActionType
  queryHash?: string
  metadata?: Record<string, unknown>
}) => {
  const event = new CustomEvent(DEV_TOOLS_EVENT, {
    detail: { type, queryHash, metadata },
    bubbles: true,
    cancelable: true,
  })
  window.dispatchEvent(event)
}

const stylesFactory = (
  theme: 'light' | 'dark',
  css: (typeof goober)['css'],
) => {
  const { colors, font, size, alpha, shadow, border } = tokens

  const t = (light: string, dark: string) => (theme === 'light' ? light : dark)

  return {
    devtoolsBtn: css`
      z-index: 100000;
      position: fixed;
      padding: 4px;
      text-align: left;

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
      & * {
        box-sizing: border-box;
        text-transform: none;
      }

      & *::-webkit-scrollbar {
        width: 7px;
      }

      & *::-webkit-scrollbar-track {
        background: transparent;
      }

      & *::-webkit-scrollbar-thumb {
        background: ${t(colors.gray[300], colors.darkGray[200])};
      }

      & *::-webkit-scrollbar-thumb:hover {
        background: ${t(colors.gray[400], colors.darkGray[300])};
      }
    `,
    parentPanel: css`
      z-index: 9999;
      display: flex;
      height: 100%;
      gap: ${tokens.size[0.5]};
      & * {
        box-sizing: border-box;
        text-transform: none;
      }

      & *::-webkit-scrollbar {
        width: 7px;
      }

      & *::-webkit-scrollbar-track {
        background: transparent;
      }

      & *::-webkit-scrollbar-thumb {
        background: ${t(colors.gray[300], colors.darkGray[200])};
      }

      & *::-webkit-scrollbar-thumb:hover {
        background: ${t(colors.gray[400], colors.darkGray[300])};
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
    'devtoolsBtn-position-relative': css`
      position: relative;
    `,
    'panel-position-top': css`
      top: 0;
      right: 0;
      left: 0;
      max-height: 90%;
      min-height: ${size[14]};
      border-bottom: ${t(colors.gray[400], colors.darkGray[300])} 1px solid;
    `,
    'panel-position-bottom': css`
      bottom: 0;
      right: 0;
      left: 0;
      max-height: 90%;
      min-height: ${size[14]};
      border-top: ${t(colors.gray[400], colors.darkGray[300])} 1px solid;
    `,
    'panel-position-right': css`
      bottom: 0;
      right: 0;
      top: 0;
      border-left: ${t(colors.gray[400], colors.darkGray[300])} 1px solid;
      max-width: 90%;
    `,
    'panel-position-left': css`
      bottom: 0;
      left: 0;
      top: 0;
      border-right: ${t(colors.gray[400], colors.darkGray[300])} 1px solid;
      max-width: 90%;
    `,
    closeBtn: css`
      position: absolute;
      cursor: pointer;
      z-index: 5;
      display: flex;
      align-items: center;
      justify-content: center;
      outline: none;
      background-color: ${t(colors.gray[50], colors.darkGray[700])};
      &:hover {
        background-color: ${t(colors.gray[200], colors.darkGray[500])};
      }
      &:focus-visible {
        outline: 2px solid ${colors.blue[600]};
      }
      & svg {
        color: ${t(colors.gray[600], colors.gray[400])};
        width: ${size[2]};
        height: ${size[2]};
      }
    `,
    'closeBtn-position-top': css`
      bottom: 0;
      right: ${size[2]};
      transform: translate(0, 100%);
      border-right: ${t(colors.gray[400], colors.darkGray[300])} 1px solid;
      border-left: ${t(colors.gray[400], colors.darkGray[300])} 1px solid;
      border-top: none;
      border-bottom: ${t(colors.gray[400], colors.darkGray[300])} 1px solid;
      border-radius: 0px 0px ${border.radius.sm} ${border.radius.sm};
      padding: ${size[0.5]} ${size[1.5]} ${size[1]} ${size[1.5]};

      &::after {
        content: ' ';
        position: absolute;
        bottom: 100%;
        left: -${size[2.5]};
        height: ${size[1.5]};
        width: calc(100% + ${size[5]});
      }

      & svg {
        transform: rotate(180deg);
      }
    `,
    'closeBtn-position-bottom': css`
      top: 0;
      right: ${size[2]};
      transform: translate(0, -100%);
      border-right: ${t(colors.gray[400], colors.darkGray[300])} 1px solid;
      border-left: ${t(colors.gray[400], colors.darkGray[300])} 1px solid;
      border-top: ${t(colors.gray[400], colors.darkGray[300])} 1px solid;
      border-bottom: none;
      border-radius: ${border.radius.sm} ${border.radius.sm} 0px 0px;
      padding: ${size[1]} ${size[1.5]} ${size[0.5]} ${size[1.5]};

      &::after {
        content: ' ';
        position: absolute;
        top: 100%;
        left: -${size[2.5]};
        height: ${size[1.5]};
        width: calc(100% + ${size[5]});
      }
    `,
    'closeBtn-position-right': css`
      bottom: ${size[2]};
      left: 0;
      transform: translate(-100%, 0);
      border-right: none;
      border-left: ${t(colors.gray[400], colors.darkGray[300])} 1px solid;
      border-top: ${t(colors.gray[400], colors.darkGray[300])} 1px solid;
      border-bottom: ${t(colors.gray[400], colors.darkGray[300])} 1px solid;
      border-radius: ${border.radius.sm} 0px 0px ${border.radius.sm};
      padding: ${size[1.5]} ${size[0.5]} ${size[1.5]} ${size[1]};

      &::after {
        content: ' ';
        position: absolute;
        left: 100%;
        height: calc(100% + ${size[5]});
        width: ${size[1.5]};
      }

      & svg {
        transform: rotate(-90deg);
      }
    `,
    'closeBtn-position-left': css`
      bottom: ${size[2]};
      right: 0;
      transform: translate(100%, 0);
      border-left: none;
      border-right: ${t(colors.gray[400], colors.darkGray[300])} 1px solid;
      border-top: ${t(colors.gray[400], colors.darkGray[300])} 1px solid;
      border-bottom: ${t(colors.gray[400], colors.darkGray[300])} 1px solid;
      border-radius: 0px ${border.radius.sm} ${border.radius.sm} 0px;
      padding: ${size[1.5]} ${size[1]} ${size[1.5]} ${size[0.5]};

      &::after {
        content: ' ';
        position: absolute;
        right: 100%;
        height: calc(100% + ${size[5]});
        width: ${size[1.5]};
      }

      & svg {
        transform: rotate(90deg);
      }
    `,
    queriesContainer: css`
      flex: 1 1 700px;
      background-color: ${t(colors.gray[50], colors.darkGray[700])};
      display: flex;
      flex-direction: column;
      & * {
        font-family: ui-sans-serif, Inter, system-ui, sans-serif, sans-serif;
      }
    `,
    dragHandle: css`
      position: absolute;
      transition: background-color 0.125s ease;
      &:hover {
        background-color: ${colors.purple[400]}${t('', alpha[90])};
      }
      z-index: 4;
    `,
    'dragHandle-position-top': css`
      bottom: 0;
      width: 100%;
      height: 3px;
      cursor: ns-resize;
    `,
    'dragHandle-position-bottom': css`
      top: 0;
      width: 100%;
      height: 3px;
      cursor: ns-resize;
    `,
    'dragHandle-position-right': css`
      left: 0;
      width: 3px;
      height: 100%;
      cursor: ew-resize;
    `,
    'dragHandle-position-left': css`
      right: 0;
      width: 3px;
      height: 100%;
      cursor: ew-resize;
    `,
    row: css`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: ${tokens.size[2]} ${tokens.size[2.5]};
      gap: ${tokens.size[2.5]};
      border-bottom: ${t(colors.gray[300], colors.darkGray[500])} 1px solid;
      align-items: center;
      & > button {
        padding: 0;
        background: transparent;
        border: none;
        display: flex;
        gap: ${size[0.5]};
        flex-direction: column;
      }
    `,
    logoAndToggleContainer: css`
      display: flex;
      gap: ${tokens.size[3]};
      align-items: center;
    `,
    logo: css`
      cursor: pointer;
      display: flex;
      flex-direction: column;
      background-color: transparent;
      border: none;
      gap: ${tokens.size[0.5]};
      padding: 0px;
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
      font-size: ${font.size.md};
      font-weight: ${font.weight.bold};
      line-height: ${font.lineHeight.xs};
      white-space: nowrap;
      color: ${t(colors.gray[600], colors.gray[300])};
    `,
    queryFlavorLogo: css`
      font-weight: ${font.weight.semibold};
      font-size: ${font.size.xs};
      background: linear-gradient(
        to right,
        ${t('#ea4037, #ff9b11', '#dd524b, #e9a03b')}
      );
      background-clip: text;
      -webkit-background-clip: text;
      line-height: 1;
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
      gap: ${tokens.size[1.5]};
      box-sizing: border-box;
      height: ${tokens.size[6.5]};
      background: ${t(colors.gray[50], colors.darkGray[500])};
      color: ${t(colors.gray[700], colors.gray[300])};
      border-radius: ${tokens.border.radius.sm};
      font-size: ${font.size.sm};
      padding: ${tokens.size[1]};
      padding-left: ${tokens.size[1.5]};
      align-items: center;
      font-weight: ${font.weight.medium};
      border: ${t('1px solid ' + colors.gray[300], '1px solid transparent')};
      user-select: none;
      position: relative;
      &:focus-visible {
        outline-offset: 2px;
        outline: 2px solid ${colors.blue[800]};
      }
    `,
    queryStatusTagLabel: css`
      font-size: ${font.size.xs};
    `,
    queryStatusCount: css`
      font-size: ${font.size.xs};
      padding: 0 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${t(colors.gray[500], colors.gray[400])};
      background-color: ${t(colors.gray[200], colors.darkGray[300])};
      border-radius: 2px;
      font-variant-numeric: tabular-nums;
      height: ${tokens.size[4.5]};
    `,
    statusTooltip: css`
      position: absolute;
      z-index: 1;
      background-color: ${t(colors.gray[50], colors.darkGray[500])};
      top: 100%;
      left: 50%;
      transform: translate(-50%, calc(${tokens.size[2]}));
      padding: ${tokens.size[0.5]} ${tokens.size[2]};
      border-radius: ${tokens.border.radius.sm};
      font-size: ${font.size.xs};
      border: 1px solid ${t(colors.gray[400], colors.gray[600])};
      color: ${t(colors['gray'][600], colors['gray'][300])};

      &::before {
        top: 0px;
        content: ' ';
        display: block;
        left: 50%;
        transform: translate(-50%, -100%);
        position: absolute;
        border-color: transparent transparent
          ${t(colors.gray[400], colors.gray[600])} transparent;
        border-style: solid;
        border-width: 7px;
        /* transform: rotate(180deg); */
      }

      &::after {
        top: 0px;
        content: ' ';
        display: block;
        left: 50%;
        transform: translate(-50%, calc(-100% + 2px));
        position: absolute;
        border-color: transparent transparent
          ${t(colors.gray[100], colors.darkGray[500])} transparent;
        border-style: solid;
        border-width: 7px;
      }
    `,
    filtersContainer: css`
      display: flex;
      gap: ${tokens.size[2]};
      & > button {
        cursor: pointer;
        padding: ${tokens.size[0.5]} ${tokens.size[1.5]} ${tokens.size[0.5]}
          ${tokens.size[2]};
        border-radius: ${tokens.border.radius.sm};
        background-color: ${t(colors.gray[100], colors.darkGray[400])};
        border: 1px solid ${t(colors.gray[300], colors.darkGray[200])};
        color: ${t(colors.gray[700], colors.gray[300])};
        font-size: ${font.size.xs};
        display: flex;
        align-items: center;
        line-height: ${font.lineHeight.sm};
        gap: ${tokens.size[1.5]};
        max-width: 160px;
        &:focus-visible {
          outline-offset: 2px;
          border-radius: ${border.radius.xs};
          outline: 2px solid ${colors.blue[800]};
        }
        & svg {
          width: ${tokens.size[3]};
          height: ${tokens.size[3]};
          color: ${t(colors.gray[500], colors.gray[400])};
        }
      }
    `,
    filterInput: css`
      padding: ${size[0.5]} ${size[2]};
      border-radius: ${tokens.border.radius.sm};
      background-color: ${t(colors.gray[100], colors.darkGray[400])};
      display: flex;
      box-sizing: content-box;
      align-items: center;
      gap: ${tokens.size[1.5]};
      max-width: 160px;
      min-width: 100px;
      border: 1px solid ${t(colors.gray[300], colors.darkGray[200])};
      height: min-content;
      color: ${t(colors.gray[600], colors.gray[400])};
      & > svg {
        width: ${size[3]};
        height: ${size[3]};
      }
      & input {
        font-size: ${font.size.xs};
        width: 100%;
        background-color: ${t(colors.gray[100], colors.darkGray[400])};
        border: none;
        padding: 0;
        line-height: ${font.lineHeight.sm};
        color: ${t(colors.gray[700], colors.gray[300])};
        &::placeholder {
          color: ${t(colors.gray[700], colors.gray[300])};
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
      padding: ${tokens.size[0.5]} ${tokens.size[2]};
      border-radius: ${tokens.border.radius.sm};
      background-color: ${t(colors.gray[100], colors.darkGray[400])};
      display: flex;
      align-items: center;
      gap: ${tokens.size[1.5]};
      box-sizing: content-box;
      max-width: 160px;
      border: 1px solid ${t(colors.gray[300], colors.darkGray[200])};
      height: min-content;
      & > svg {
        color: ${t(colors.gray[600], colors.gray[400])};
        width: ${tokens.size[2]};
        height: ${tokens.size[2]};
      }
      & > select {
        appearance: none;
        color: ${t(colors.gray[700], colors.gray[300])};
        min-width: 100px;
        line-height: ${font.lineHeight.sm};
        font-size: ${font.size.xs};
        background-color: ${t(colors.gray[100], colors.darkGray[400])};
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
      gap: ${tokens.size[2]};
    `,
    actionsBtn: css`
      border-radius: ${tokens.border.radius.sm};
      background-color: ${t(colors.gray[100], colors.darkGray[400])};
      border: 1px solid ${t(colors.gray[300], colors.darkGray[200])};
      width: ${tokens.size[6.5]};
      height: ${tokens.size[6.5]};
      justify-content: center;
      display: flex;
      align-items: center;
      gap: ${tokens.size[1.5]};
      max-width: 160px;
      cursor: pointer;
      padding: 0;
      &:hover {
        background-color: ${t(colors.gray[200], colors.darkGray[500])};
      }
      & svg {
        color: ${t(colors.gray[700], colors.gray[300])};
        width: ${tokens.size[3]};
        height: ${tokens.size[3]};
      }
      &:focus-visible {
        outline-offset: 2px;
        border-radius: ${border.radius.xs};
        outline: 2px solid ${colors.blue[800]};
      }
    `,
    actionsBtnOffline: css`
      & svg {
        stroke: ${t(colors.yellow[700], colors.yellow[500])};
        fill: ${t(colors.yellow[700], colors.yellow[500])};
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
      border: none;
      cursor: pointer;
      color: ${t(colors.gray[700], colors.gray[300])};
      background-color: ${t(colors.gray[50], colors.darkGray[700])};
      line-height: 1;
      &:focus {
        outline: none;
      }
      &:focus-visible {
        outline-offset: -2px;
        border-radius: ${border.radius.xs};
        outline: 2px solid ${colors.blue[800]};
      }
      &:hover .tsqd-query-hash {
        background-color: ${t(colors.gray[200], colors.darkGray[600])};
      }

      & .tsqd-query-observer-count {
        padding: 0 ${tokens.size[1]};
        user-select: none;
        min-width: ${tokens.size[6.5]};
        align-self: stretch;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${font.size.xs};
        font-weight: ${font.weight.medium};
        border-bottom-width: 1px;
        border-bottom-style: solid;
        border-bottom: 1px solid ${t(colors.gray[300], colors.darkGray[700])};
      }
      & .tsqd-query-hash {
        user-select: text;
        font-size: ${font.size.xs};
        display: flex;
        align-items: center;
        min-height: ${tokens.size[6]};
        flex: 1;
        padding: ${tokens.size[1]} ${tokens.size[2]};
        font-family:
          ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
          'Liberation Mono', 'Courier New', monospace;
        border-bottom: 1px solid ${t(colors.gray[300], colors.darkGray[400])};
        text-align: left;
        text-overflow: clip;
        word-break: break-word;
      }

      & .tsqd-query-disabled-indicator {
        align-self: stretch;
        display: flex;
        align-items: center;
        padding: 0 ${tokens.size[2]};
        color: ${t(colors.gray[800], colors.gray[300])};
        background-color: ${t(colors.gray[300], colors.darkGray[600])};
        border-bottom: 1px solid ${t(colors.gray[300], colors.darkGray[400])};
        font-size: ${font.size.xs};
      }

      & .tsqd-query-static-indicator {
        align-self: stretch;
        display: flex;
        align-items: center;
        padding: 0 ${tokens.size[2]};
        color: ${t(colors.teal[800], colors.teal[300])};
        background-color: ${t(colors.teal[100], colors.teal[900])};
        border-bottom: 1px solid ${t(colors.teal[300], colors.teal[700])};
        font-size: ${font.size.xs};
      }
    `,
    selectedQueryRow: css`
      background-color: ${t(colors.gray[200], colors.darkGray[500])};
    `,
    detailsContainer: css`
      flex: 1 1 700px;
      background-color: ${t(colors.gray[50], colors.darkGray[700])};
      color: ${t(colors.gray[700], colors.gray[300])};
      font-family: ui-sans-serif, Inter, system-ui, sans-serif, sans-serif;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      display: flex;
      text-align: left;
    `,
    detailsHeader: css`
      font-family: ui-sans-serif, Inter, system-ui, sans-serif, sans-serif;
      position: sticky;
      top: 0;
      z-index: 2;
      background-color: ${t(colors.gray[200], colors.darkGray[600])};
      padding: ${tokens.size[1.5]} ${tokens.size[2]};
      font-weight: ${font.weight.medium};
      font-size: ${font.size.xs};
      line-height: ${font.lineHeight.xs};
      text-align: left;
    `,
    detailsBody: css`
      margin: ${tokens.size[1.5]} 0px ${tokens.size[2]} 0px;
      & > div {
        display: flex;
        align-items: stretch;
        padding: 0 ${tokens.size[2]};
        line-height: ${font.lineHeight.sm};
        justify-content: space-between;
        & > span {
          font-size: ${font.size.xs};
        }
        & > span:nth-child(2) {
          font-variant-numeric: tabular-nums;
        }
      }

      & > div:first-child {
        margin-bottom: ${tokens.size[1.5]};
      }

      & code {
        font-family:
          ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
          'Liberation Mono', 'Courier New', monospace;
        margin: 0;
        font-size: ${font.size.xs};
        line-height: ${font.lineHeight.xs};
        max-width: 100%;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      & pre {
        margin: 0;
        display: flex;
        align-items: center;
      }
    `,
    queryDetailsStatus: css`
      border: 1px solid ${colors.darkGray[200]};
      border-radius: ${tokens.border.radius.sm};
      font-weight: ${font.weight.medium};
      padding: ${tokens.size[1]} ${tokens.size[2.5]};
    `,
    actionsBody: css`
      flex-wrap: wrap;
      margin: ${tokens.size[2]} 0px ${tokens.size[2]} 0px;
      display: flex;
      gap: ${tokens.size[2]};
      padding: 0px ${tokens.size[2]};
      & > button {
        font-family: ui-sans-serif, Inter, system-ui, sans-serif, sans-serif;
        font-size: ${font.size.xs};
        padding: ${tokens.size[1]} ${tokens.size[2]};
        display: flex;
        border-radius: ${tokens.border.radius.sm};
        background-color: ${t(colors.gray[100], colors.darkGray[600])};
        border: 1px solid ${t(colors.gray[300], colors.darkGray[400])};
        align-items: center;
        gap: ${tokens.size[2]};
        font-weight: ${font.weight.medium};
        line-height: ${font.lineHeight.xs};
        cursor: pointer;
        &:focus-visible {
          outline-offset: 2px;
          border-radius: ${border.radius.xs};
          outline: 2px solid ${colors.blue[800]};
        }
        &:hover {
          background-color: ${t(colors.gray[200], colors.darkGray[500])};
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        & > span {
          width: ${size[1.5]};
          height: ${size[1.5]};
          border-radius: ${tokens.border.radius.full};
        }
      }
    `,
    actionsSelect: css`
      font-size: ${font.size.xs};
      padding: ${tokens.size[0.5]} ${tokens.size[2]};
      display: flex;
      border-radius: ${tokens.border.radius.sm};
      overflow: hidden;
      background-color: ${t(colors.gray[100], colors.darkGray[600])};
      border: 1px solid ${t(colors.gray[300], colors.darkGray[400])};
      align-items: center;
      gap: ${tokens.size[2]};
      font-weight: ${font.weight.medium};
      line-height: ${font.lineHeight.sm};
      color: ${t(colors.red[500], colors.red[400])};
      cursor: pointer;
      position: relative;
      &:hover {
        background-color: ${t(colors.gray[200], colors.darkGray[500])};
      }
      & > span {
        width: ${size[1.5]};
        height: ${size[1.5]};
        border-radius: ${tokens.border.radius.full};
      }
      &:focus-within {
        outline-offset: 2px;
        border-radius: ${border.radius.xs};
        outline: 2px solid ${colors.blue[800]};
      }
      & select {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        appearance: none;
        background-color: transparent;
        border: none;
        color: transparent;
        outline: none;
      }

      & svg path {
        stroke: ${tokens.colors.red[400]};
      }
      & svg {
        width: ${tokens.size[2]};
        height: ${tokens.size[2]};
      }
    `,
    settingsMenu: css`
      display: flex;
      & * {
        font-family: ui-sans-serif, Inter, system-ui, sans-serif, sans-serif;
      }
      flex-direction: column;
      gap: ${size[0.5]};
      border-radius: ${tokens.border.radius.sm};
      border: 1px solid ${t(colors.gray[300], colors.gray[700])};
      background-color: ${t(colors.gray[50], colors.darkGray[600])};
      font-size: ${font.size.xs};
      color: ${t(colors.gray[700], colors.gray[300])};
      z-index: 99999;
      min-width: 120px;
      padding: ${size[0.5]};
    `,
    settingsSubTrigger: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-radius: ${tokens.border.radius.xs};
      padding: ${tokens.size[1]} ${tokens.size[1]};
      cursor: pointer;
      background-color: transparent;
      border: none;
      color: ${t(colors.gray[700], colors.gray[300])};
      & svg {
        color: ${t(colors.gray[600], colors.gray[400])};
        transform: rotate(-90deg);
        width: ${tokens.size[2]};
        height: ${tokens.size[2]};
      }
      &:hover {
        background-color: ${t(colors.gray[200], colors.darkGray[500])};
      }
      &:focus-visible {
        outline-offset: 2px;
        outline: 2px solid ${colors.blue[800]};
      }
      &.data-disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `,
    settingsMenuHeader: css`
      padding: ${tokens.size[1]} ${tokens.size[1]};
      font-weight: ${font.weight.medium};
      border-bottom: 1px solid ${t(colors.gray[300], colors.darkGray[400])};
      color: ${t(colors.gray[500], colors.gray[400])};
      font-size: ${font.size['xs']};
    `,
    settingsSubButton: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: ${t(colors.gray[700], colors.gray[300])};
      font-size: ${font.size['xs']};
      border-radius: ${tokens.border.radius.xs};
      padding: ${tokens.size[1]} ${tokens.size[1]};
      cursor: pointer;
      background-color: transparent;
      border: none;
      & svg {
        color: ${t(colors.gray[600], colors.gray[400])};
      }
      &:hover {
        background-color: ${t(colors.gray[200], colors.darkGray[500])};
      }
      &:focus-visible {
        outline-offset: 2px;
        outline: 2px solid ${colors.blue[800]};
      }
    `,
    themeSelectedButton: css`
      background-color: ${t(colors.purple[100], colors.purple[900])};
      color: ${t(colors.purple[700], colors.purple[300])};
      & svg {
        color: ${t(colors.purple[700], colors.purple[300])};
      }
      &:hover {
        background-color: ${t(colors.purple[100], colors.purple[900])};
      }
    `,
    viewToggle: css`
      border-radius: ${tokens.border.radius.sm};
      background-color: ${t(colors.gray[200], colors.darkGray[600])};
      border: 1px solid ${t(colors.gray[300], colors.darkGray[200])};
      display: flex;
      padding: 0;
      font-size: ${font.size.xs};
      color: ${t(colors.gray[700], colors.gray[300])};
      overflow: hidden;

      &:has(:focus-visible) {
        outline: 2px solid ${colors.blue[800]};
      }

      & .tsqd-radio-toggle {
        opacity: 0.5;
        display: flex;
        & label {
          display: flex;
          align-items: center;
          cursor: pointer;
          line-height: ${font.lineHeight.md};
        }

        & label:hover {
          background-color: ${t(colors.gray[100], colors.darkGray[500])};
        }
      }

      & > [data-checked] {
        opacity: 1;
        background-color: ${t(colors.gray[100], colors.darkGray[400])};
        & label:hover {
          background-color: ${t(colors.gray[100], colors.darkGray[400])};
        }
      }

      & .tsqd-radio-toggle:first-child {
        & label {
          padding: 0 ${tokens.size[1.5]} 0 ${tokens.size[2]};
        }
        border-right: 1px solid ${t(colors.gray[300], colors.darkGray[200])};
      }

      & .tsqd-radio-toggle:nth-child(2) {
        & label {
          padding: 0 ${tokens.size[2]} 0 ${tokens.size[1.5]};
        }
      }
    `,
    devtoolsEditForm: css`
      padding: ${size[2]};
      & > [data-error='true'] {
        outline: 2px solid ${t(colors.red[200], colors.red[800])};
        outline-offset: 2px;
        border-radius: ${border.radius.xs};
      }
    `,
    devtoolsEditTextarea: css`
      width: 100%;
      max-height: 500px;
      font-family: 'Fira Code', monospace;
      font-size: ${font.size.xs};
      border-radius: ${border.radius.sm};
      field-sizing: content;
      padding: ${size[2]};
      background-color: ${t(colors.gray[100], colors.darkGray[800])};
      color: ${t(colors.gray[900], colors.gray[100])};
      border: 1px solid ${t(colors.gray[200], colors.gray[700])};
      resize: none;
      &:focus {
        outline-offset: 2px;
        border-radius: ${border.radius.xs};
        outline: 2px solid ${t(colors.blue[200], colors.blue[800])};
      }
    `,
    devtoolsEditFormActions: css`
      display: flex;
      justify-content: space-between;
      gap: ${size[2]};
      align-items: center;
      padding-top: ${size[1]};
      font-size: ${font.size.xs};
    `,
    devtoolsEditFormError: css`
      color: ${t(colors.red[700], colors.red[500])};
    `,
    devtoolsEditFormActionContainer: css`
      display: flex;
      gap: ${size[2]};
    `,
    devtoolsEditFormAction: css`
      font-family: ui-sans-serif, Inter, system-ui, sans-serif, sans-serif;
      font-size: ${font.size.xs};
      padding: ${size[1]} ${tokens.size[2]};
      display: flex;
      border-radius: ${border.radius.sm};
      background-color: ${t(colors.gray[100], colors.darkGray[600])};
      border: 1px solid ${t(colors.gray[300], colors.darkGray[400])};
      align-items: center;
      gap: ${size[2]};
      font-weight: ${font.weight.medium};
      line-height: ${font.lineHeight.xs};
      cursor: pointer;
      &:focus-visible {
        outline-offset: 2px;
        border-radius: ${border.radius.xs};
        outline: 2px solid ${colors.blue[800]};
      }
      &:hover {
        background-color: ${t(colors.gray[200], colors.darkGray[500])};
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `,
  }
}

const lightStyles = (css: (typeof goober)['css']) => stylesFactory('light', css)
const darkStyles = (css: (typeof goober)['css']) => stylesFactory('dark', css)
