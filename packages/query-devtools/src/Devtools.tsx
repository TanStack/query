import { DropdownMenu, RadioGroup } from '@kobalte/core'
import { createResizeObserver } from '@solid-primitives/resize-observer'
import { rankItem } from '@tanstack/match-sorter-utils'
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
import { Portal } from 'solid-js/web'
import { TransitionGroup } from 'solid-transition-group'
import Explorer, { SearchableExplorer } from './Explorer'
import { VirtualList } from './VirtualList'
import {
  BUTTON_POSITION,
  DEFAULT_FILTER_SCOPE,
  DEFAULT_HEIGHT,
  DEFAULT_MUTATION_SORT_FN_NAME,
  DEFAULT_SORT_FN_NAME,
  DEFAULT_SORT_ORDER,
  DEFAULT_WIDTH,
  FILTER_SCOPES,
  INITIAL_IS_OPEN,
  POSITION,
  firstBreakpoint,
  secondBreakpoint,
  thirdBreakpoint,
} from './constants'
import { usePiPWindow, useQueryDevtoolsContext, useTheme } from './contexts'
import { useDevtoolsOffline } from './contexts/DevtoolsOfflineContext'
import { useDevtoolsState } from './contexts/DevtoolsStateContext'
import { useDevtoolsSubscriptions } from './contexts/DevtoolsSubscriptionsContext'
import { createSearchText } from './explorerSearch'
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
import { attachStyles, createThemed } from './styles'
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
import type { StorageObject, StorageSetter } from '@solid-primitives/storage'
import type {
  Mutation,
  MutationCache,
  MutationCacheNotifyEvent,
  Query,
  QueryCache,
  QueryCacheNotifyEvent,
} from '@tanstack/query-core'
import type { Accessor, Component, JSX } from 'solid-js'
import type { FilterScope } from './constants'
import type {
  DevtoolsErrorType,
  DevtoolsPosition,
  QueryDevtoolsProps,
} from './contexts'

const filterScopeLabels: Record<FilterScope, string> = {
  key: 'Key',
  data: 'Data',
  all: 'All',
}

const filterScopeAriaLabels: Record<
  'queries' | 'mutations',
  Record<FilterScope, string>
> = {
  queries: {
    key: 'Filter queries by query key',
    data: 'Filter queries by query data',
    all: 'Filter queries by query key or data',
  },
  mutations: {
    key: 'Filter mutations by mutation key',
    data: 'Filter mutations by variables or data',
    all: 'Filter mutations by mutation key, variables or data',
  },
}

// Query data is immutable. Cached mutation text is invalidated when mutation state changes.
const dataSearchTexts = new WeakMap<object, string>()

/**
 * Gets the cached search text of query or mutation data, building it if there is time left.
 * @param data - The query data, or mutation variables or data.
 * @param deadline - When to stop building search texts, compared to `performance.now()`.
 * @returns The search text, or undefined if it isn't built and the deadline has passed.
 */
const getDataSearchText = (data: unknown, deadline = Infinity) => {
  if (typeof data !== 'object' || data === null) return createSearchText(data)
  let text = dataSearchTexts.get(data)
  if (text === undefined && performance.now() < deadline) {
    text = createSearchText(data)
    dataSearchTexts.set(data, text)
  }
  return text
}

/**
 * Checks whether data contains the term. Missing data never matches.
 * @param data - The query data, or mutation variables or data.
 * @param term - The lowercased search term.
 * @returns Whether the data matches.
 */
const matchesData = (data: unknown, term: string) =>
  data !== undefined && getDataSearchText(data)!.includes(term)

/**
 * Builds data search texts for a few milliseconds per task, so filtering by data doesn't block
 * the page.
 * @returns `version`, which changes when building continued in a later task, and `prepare`,
 * which returns whether the search texts of all the data are built.
 */
const createDataSearchTexts = () => {
  const [version, setVersion] = createSignal(0)
  let timeout: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => clearTimeout(timeout))

  const prepare = (data: Array<unknown>) => {
    clearTimeout(timeout)
    const deadline = performance.now() + 8
    if (data.every((item) => getDataSearchText(item, deadline) !== undefined)) {
      return true
    }
    timeout = setTimeout(() => setVersion((current) => current + 1))
    return false
  }

  return { version, prepare }
}

interface DevtoolsPanelProps {
  localStore: StorageObject<string>
  setLocalStore: StorageSetter<string, unknown>
}

interface ContentViewProps {
  localStore: StorageObject<string>
  setLocalStore: StorageSetter<string, unknown>
  showPanelViewOnly?: boolean
  onClose?: () => void
}

interface QueryStatusProps {
  label: string
  color: 'green' | 'yellow' | 'gray' | 'blue' | 'purple' | 'red'
  count: number
}

/**
 * The devtools component that `TanstackQueryDevtools` and `TanstackQueryDevtoolsPanel` lazily load
 * and render.
 */
export type DevtoolsComponentType = Component<QueryDevtoolsProps> & {
  shadowDOMTarget?: ShadowRoot
}

/**
 * The floating devtools: a toggle button that opens a resizable panel, or the
 * panel in a picture-in-picture window when one is open.
 * @param props - The `localStore` that persists the devtools settings, and its
 * `setLocalStore` setter.
 * @returns The toggle button and the panel.
 */
export const Devtools: Component<DevtoolsPanelProps> = (props) => {
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
  onMount(() => {
    attachStyles(
      transitionsContainerRef,
      useQueryDevtoolsContext().shadowDOMTarget,
    )
  })

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
        class={`tsqd-style-transitions tsqd-style-transitions-${position() === 'top' || position() === 'bottom' ? 'vertical' : 'horizontal'} tsqd-style-transitions-button-${buttonPosition()} tsqd-transitions-container`}
        dir="ltr"
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
              class={`tsqd-style-devtools-btn tsqd-style-devtools-btn-position-${buttonPosition()} tsqd-open-btn-container`}
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
  const { panelWidth, setPanelWidth } = useDevtoolsState()

  const pip = usePiPWindow()
  const theme = useTheme()
  const themed = createThemed(theme)

  let panelRef!: HTMLDivElement
  onMount(() => {
    attachStyles(panelRef)
  })

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
      ref={panelRef}
      dir="ltr"
      style={{
        '--tsqd-font-size': '16px',
        'max-height': '100vh',
        height: '100vh',
        width: '100vw',
      }}
      class={`${themed('tsqd-style-panel')} ${themed(panelWidth() < secondBreakpoint ? 'tsqd-style-panel-column' : 'tsqd-style-panel-row')} ${panelWidth() < thirdBreakpoint ? 'tsqd-style-panel-min-content' : ''} tsqd-main-panel`}
    >
      {props.children}
    </div>
  )
}

/**
 * The container of the embedded devtools panel, which tracks its width for
 * the responsive layout.
 * @param props - The `children` to render inside the panel.
 * @returns The panel container.
 */
export const ParentPanel: Component<{
  children: JSX.Element
}> = (props) => {
  const { panelWidth, setPanelWidth } = useDevtoolsState()

  const theme = useTheme()
  const themed = createThemed(theme)

  let panelRef!: HTMLDivElement

  onMount(() => {
    attachStyles(panelRef, useQueryDevtoolsContext().shadowDOMTarget)
    createResizeObserver(panelRef, ({ width }, el) => {
      if (el === panelRef) {
        setPanelWidth(width)
      }
    })
  })

  return (
    <div
      dir="ltr"
      style={{
        '--tsqd-font-size': '16px',
      }}
      ref={panelRef}
      class={`${themed('tsqd-style-parent-panel')} ${themed(panelWidth() < secondBreakpoint ? 'tsqd-style-panel-column' : 'tsqd-style-panel-row')} ${panelWidth() < thirdBreakpoint ? 'tsqd-style-panel-min-content' : ''} tsqd-main-panel`}
    >
      {props.children}
    </div>
  )
}

const DraggablePanel: Component<DevtoolsPanelProps> = (props) => {
  const { setSelectedQueryHash, panelWidth, setPanelWidth } = useDevtoolsState()

  const theme = useTheme()
  const themed = createThemed(theme)

  let closeBtnRef!: HTMLButtonElement

  // Focus the close button when the panel opens for screen reader accessibility
  onMount(() => {
    closeBtnRef.focus()
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
      document.removeEventListener('mouseup', unsubscribe, false)
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

  return (
    <aside
      // Some context for styles here
      // background-color - Changes to a lighter color create a harder contrast
      // between the queries and query detail panel
      // -
      // min-width - When the panel is in the left or right position, the panel
      // width is set to min-content to allow the panel to shrink to the lowest possible width
      class={`${themed('tsqd-style-panel')} ${themed(`tsqd-style-panel-position-${position()}`)} ${themed(panelWidth() < secondBreakpoint ? 'tsqd-style-panel-column' : 'tsqd-style-panel-row')} ${panelWidth() < thirdBreakpoint && (position() === 'right' || position() === 'left') ? 'tsqd-style-panel-min-content' : ''} tsqd-main-panel`}
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
        role="separator"
        aria-orientation={
          position() === 'top' || position() === 'bottom'
            ? 'horizontal'
            : 'vertical'
        }
        aria-label="Resize devtools panel"
        aria-valuemin={
          position() === 'top' || position() === 'bottom'
            ? convertRemToPixels(3.5)
            : convertRemToPixels(12)
        }
        aria-valuenow={
          position() === 'top' || position() === 'bottom'
            ? Number(props.localStore.height || DEFAULT_HEIGHT)
            : Number(props.localStore.width || DEFAULT_WIDTH)
        }
        tabindex="0"
        class={`${themed('tsqd-style-drag-handle')} tsqd-style-drag-handle-position-${position()} tsqd-drag-handle`}
        onMouseDown={handleDragStart}
        onKeyDown={(e) => {
          const step = 10
          const minHeight = convertRemToPixels(3.5)
          const minWidth = convertRemToPixels(12)
          if (position() === 'top' || position() === 'bottom') {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault()
              const currentHeight = Number(
                props.localStore.height || DEFAULT_HEIGHT,
              )
              const delta =
                position() === 'bottom'
                  ? e.key === 'ArrowUp'
                    ? step
                    : -step
                  : e.key === 'ArrowDown'
                    ? step
                    : -step
              const newHeight = Math.max(minHeight, currentHeight + delta)
              props.setLocalStore('height', String(newHeight))
            }
          } else {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
              e.preventDefault()
              const currentWidth = Number(
                props.localStore.width || DEFAULT_WIDTH,
              )
              const delta =
                position() === 'right'
                  ? e.key === 'ArrowLeft'
                    ? step
                    : -step
                  : e.key === 'ArrowRight'
                    ? step
                    : -step
              const newWidth = Math.max(minWidth, currentWidth + delta)
              props.setLocalStore('width', String(newWidth))
            }
          }
        }}
      ></div>
      <button
        ref={closeBtnRef}
        aria-label="Close tanstack query devtools"
        class={`${themed('tsqd-style-close-btn')} ${themed(`tsqd-style-close-btn-position-${position()}`)} tsqd-minimize-btn`}
        onClick={() => props.setLocalStore('open', 'false')}
      >
        <ChevronDown />
      </button>
      <ContentView {...props} />
    </aside>
  )
}

/**
 * The content of the devtools panel: the query and mutation lists with their
 * filters and actions, and the details of the selected query or mutation.
 * @param props - The `localStore` and `setLocalStore` that persist the devtools
 * settings, `showPanelViewOnly` to hide the controls that only apply to the
 * floating devtools, and `onClose` to close an embedded panel.
 * @returns The panel content.
 */
export const ContentView: Component<ContentViewProps> = (props) => {
  const {
    selectedQueryHash,
    setSelectedQueryHash,
    selectedMutationId,
    setSelectedMutationId,
    panelWidth,
  } = useDevtoolsState()

  const { offline, toggleOffline } = useDevtoolsOffline()

  setupQueryCacheSubscription()
  setupMutationCacheSubscription()
  let containerRef!: HTMLDivElement
  const theme = useTheme()
  const themed = createThemed(theme)

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

  const query_cache = createMemo(() => {
    return useQueryDevtoolsContext().client.getQueryCache()
  })

  const mutation_cache = createMemo(() => {
    return useQueryDevtoolsContext().client.getMutationCache()
  })

  const queryCount = createSubscribeToQueryCacheBatcher((queryCache) => {
    return queryCache().getAll().length
  }, false)

  const hideDisabledQueries = createMemo(() => {
    return props.localStore.hideDisabledQueries === 'true'
      ? true
      : props.localStore.hideDisabledQueries === 'false'
        ? false
        : useQueryDevtoolsContext().hideDisabledQueries || false
  })

  const filterScope = createMemo<FilterScope>(() => {
    const scope = props.localStore.filterScope as FilterScope
    return FILTER_SCOPES.includes(scope) ? scope : DEFAULT_FILTER_SCOPE
  })

  const cycleFilterScope = () => {
    const index = FILTER_SCOPES.indexOf(filterScope())
    props.setLocalStore(
      'filterScope',
      FILTER_SCOPES[(index + 1) % FILTER_SCOPES.length]!,
    )
  }

  // Data changes don't change the query count, so data searches need their own trigger
  const queryDataVersion = createSubscribeToQueryCacheBatcher(
    () => ({}),
    false,
    (event) =>
      filterScope() !== 'key' &&
      !!props.localStore.filter &&
      event.type === 'updated' &&
      (event.action.type === 'success' || event.action.type === 'setState'),
  )

  const queryDataSearchTexts = createDataSearchTexts()

  const queries = createMemo(
    on(
      () => [
        queryCount(),
        props.localStore.filter,
        filterScope(),
        queryDataVersion(),
        queryDataSearchTexts.version(),
        sort(),
        sortOrder(),
        hideDisabledQueries(),
      ],
      (_input, _prevInput, prev: Array<Query> | undefined) => {
        const curr = query_cache().getAll()
        const filter = props.localStore.filter || ''
        const scope = filterScope()
        const dataTerm = filter.toLowerCase()

        if (
          filter &&
          scope !== 'key' &&
          !queryDataSearchTexts.prepare(curr.map((item) => item.state.data))
        ) {
          // Keeps the previous results until all search texts are built
          return prev ?? []
        }

        let filtered = filter
          ? curr.filter(
              (item) =>
                (scope !== 'data' && rankItem(item.queryHash, filter).passed) ||
                (scope !== 'key' && matchesData(item.state.data, dataTerm)),
            )
          : [...curr]

        // Filter out disabled queries if hideDisabledQueries is enabled
        if (hideDisabledQueries()) {
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

  // Variables and data changes don't change the mutation count, so data searches need their own trigger
  const mutationDataVersion = createSubscribeToMutationCacheBatcher(
    () => ({}),
    false,
    (event) => {
      if (event.type !== 'updated') return false
      // Mutation functions can change variables in place, including when no data filter is active.
      for (const value of [
        event.mutation.state.variables,
        event.mutation.state.data,
      ]) {
        if (typeof value === 'object' && value !== null) {
          dataSearchTexts.delete(value)
        }
      }
      return filterScope() !== 'key' && !!props.localStore.mutationFilter
    },
  )

  const mutationDataSearchTexts = createDataSearchTexts()

  const mutations = createMemo(
    on(
      () => [
        mutationCount(),
        props.localStore.mutationFilter,
        filterScope(),
        mutationDataVersion(),
        mutationDataSearchTexts.version(),
        mutationSort(),
        mutationSortOrder(),
      ],
      (_input, _prevInput, prev: Array<Mutation> | undefined) => {
        const curr = mutation_cache().getAll()
        const filter = props.localStore.mutationFilter || ''
        const scope = filterScope()
        const dataTerm = filter.toLowerCase()

        if (
          filter &&
          scope !== 'key' &&
          !mutationDataSearchTexts.prepare(
            curr.flatMap((item) => [item.state.variables, item.state.data]),
          )
        ) {
          // Keeps the previous results until all search texts are built
          return prev ?? []
        }

        const filtered = filter
          ? curr.filter((item) => {
              const value = `${
                item.options.mutationKey
                  ? JSON.stringify(item.options.mutationKey) + ' - '
                  : ''
              }${new Date(item.state.submittedAt).toLocaleString()}`
              return (
                (scope !== 'data' && rankItem(value, filter).passed) ||
                (scope !== 'key' &&
                  (matchesData(item.state.variables, dataTerm) ||
                    matchesData(item.state.data, dataTerm)))
              )
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

  // Adds the styles and sets the font size variable on portal menu elements,
  // since they are outside the main panel container
  const setupPortal = (el: HTMLDivElement) => {
    attachStyles(el)
    const computedStyle = getComputedStyle(containerRef)
    const variable = computedStyle.getPropertyValue('--tsqd-font-size')
    el.style.setProperty('--tsqd-font-size', variable)
  }
  return (
    <>
      <div
        // When the panels are stacked we use the height style
        // to divide the panels into two equal parts
        class={`${themed('tsqd-style-queries-container')} ${panelWidth() < secondBreakpoint ? (selectedQueryHash() || selectedMutationId() ? 'tsqd-style-queries-container-half' : 'tsqd-style-queries-container-full') : ''} tsqd-queries-container`}
        ref={containerRef}
      >
        <div class={`${themed('tsqd-style-row')} tsqd-header`}>
          <div class="tsqd-style-logo-and-toggle-container">
            <button
              class="tsqd-style-logo tsqd-text-logo-container"
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
                class={`${themed('tsqd-style-tanstack-logo')} tsqd-text-logo-tanstack`}
              >
                TANSTACK
              </span>
              <span
                class={`${themed('tsqd-style-query-flavor-logo')} tsqd-text-logo-query-flavor`}
              >
                {useQueryDevtoolsContext().queryFlavor} v
                {useQueryDevtoolsContext().version}
              </span>
            </button>
            <RadioGroup.Root
              class={themed('tsqd-style-view-toggle')}
              value={selectedView()}
              aria-label="Toggle between queries and mutations view"
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
        <div
          class={`${themed('tsqd-style-row')} tsqd-filters-actions-container`}
        >
          <div
            class={`${themed('tsqd-style-filters-container')} tsqd-filters-container`}
          >
            <div
              class={`${themed('tsqd-style-filter-input')} tsqd-query-filter-textfield-container`}
            >
              <Search />
              <input
                aria-label={
                  filterScopeAriaLabels[selectedView()][filterScope()]
                }
                type="text"
                placeholder="Filter"
                onInput={(e) => {
                  if (selectedView() === 'queries') {
                    props.setLocalStore('filter', e.currentTarget.value)
                  } else {
                    props.setLocalStore('mutationFilter', e.currentTarget.value)
                  }
                }}
                class="tsqd-query-filter-textfield"
                name="tsqd-query-filter-input"
                value={
                  selectedView() === 'queries'
                    ? props.localStore.filter || ''
                    : props.localStore.mutationFilter || ''
                }
              />
              <button
                type="button"
                onClick={cycleFilterScope}
                class={`${themed('tsqd-style-filter-scope-btn')} tsqd-query-filter-scope-btn`}
                aria-label={`Filter scope: ${filterScopeLabels[filterScope()]}`}
                title={`${filterScopeAriaLabels[selectedView()][filterScope()]}. Click to switch between key, data, and both.`}
                data-scope={filterScope()}
              >
                {filterScopeLabels[filterScope()]}
              </button>
            </div>
            <div
              class={`${themed('tsqd-style-filter-select')} tsqd-query-filter-sort-container`}
            >
              <Show when={selectedView() === 'queries'}>
                <select
                  value={sort()}
                  name="tsqd-queries-filter-sort"
                  aria-label="Sort queries by"
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
                  aria-label="Sort mutations by"
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

          <div class="tsqd-style-actions-container tsqd-actions-container">
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
              class={`${themed('tsqd-style-actions-btn')} tsqd-actions-btn tsqd-action-clear-cache`}
              aria-label="Clear query cache"
              title={`Clear ${selectedView()} cache`}
            >
              <Trash />
            </button>
            <button
              onClick={toggleOffline}
              class={`${themed('tsqd-style-actions-btn')} ${offline() ? themed('tsqd-style-actions-btn-offline') : ''} tsqd-actions-btn tsqd-action-mock-offline-behavior`}
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
                class={`${themed('tsqd-style-actions-btn')} tsqd-actions-btn tsqd-action-open-pip`}
                aria-label="Open in picture-in-picture mode"
                title="Open in picture-in-picture mode"
              >
                <PiPIcon />
              </button>
            </Show>

            <DropdownMenu.Root gutter={4}>
              <DropdownMenu.Trigger
                class={`${themed('tsqd-style-actions-btn')} tsqd-actions-btn tsqd-action-settings`}
                aria-label="Open settings menu"
                title="Open settings menu"
              >
                <Settings />
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal
                ref={(el) => setupPortal(el as HTMLDivElement)}
                mount={
                  pip().pipWindow
                    ? pip().pipWindow!.document.body
                    : document.body
                }
              >
                <DropdownMenu.Content
                  dir="ltr"
                  class={`${themed('tsqd-style-settings-menu')} tsqd-settings-menu`}
                >
                  <div
                    class={`${themed('tsqd-style-settings-menu-header')} tsqd-settings-menu-header`}
                  >
                    Settings
                  </div>
                  <Show when={!props.showPanelViewOnly}>
                    <DropdownMenu.Sub overlap gutter={8} shift={-4}>
                      <DropdownMenu.SubTrigger
                        class={`${themed('tsqd-style-settings-sub-trigger')} tsqd-settings-menu-sub-trigger tsqd-settings-menu-sub-trigger-position`}
                      >
                        <span>Position</span>
                        <ChevronDown />
                      </DropdownMenu.SubTrigger>
                      <DropdownMenu.Portal
                        ref={(el) => setupPortal(el as HTMLDivElement)}
                        mount={
                          pip().pipWindow
                            ? pip().pipWindow!.document.body
                            : document.body
                        }
                      >
                        <DropdownMenu.SubContent
                          dir="ltr"
                          class={`${themed('tsqd-style-settings-menu')} tsqd-settings-submenu`}
                        >
                          <DropdownMenu.RadioGroup
                            aria-label="Position settings"
                            value={props.localStore.position}
                            onChange={(value) =>
                              setDevtoolsPosition(value as DevtoolsPosition)
                            }
                          >
                            <DropdownMenu.RadioItem
                              value="top"
                              class={`${themed('tsqd-style-settings-sub-button')} tsqd-settings-menu-position-btn tsqd-settings-menu-position-btn-top`}
                            >
                              <span>Top</span>
                              <ArrowUp />
                            </DropdownMenu.RadioItem>
                            <DropdownMenu.RadioItem
                              value="bottom"
                              class={`${themed('tsqd-style-settings-sub-button')} tsqd-settings-menu-position-btn tsqd-settings-menu-position-btn-bottom`}
                            >
                              <span>Bottom</span>
                              <ArrowDown />
                            </DropdownMenu.RadioItem>
                            <DropdownMenu.RadioItem
                              value="left"
                              class={`${themed('tsqd-style-settings-sub-button')} tsqd-settings-menu-position-btn tsqd-settings-menu-position-btn-left`}
                            >
                              <span>Left</span>
                              <ArrowLeft />
                            </DropdownMenu.RadioItem>
                            <DropdownMenu.RadioItem
                              value="right"
                              class={`${themed('tsqd-style-settings-sub-button')} tsqd-settings-menu-position-btn tsqd-settings-menu-position-btn-right`}
                            >
                              <span>Right</span>
                              <ArrowRight />
                            </DropdownMenu.RadioItem>
                          </DropdownMenu.RadioGroup>
                        </DropdownMenu.SubContent>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Sub>
                  </Show>
                  <DropdownMenu.Sub overlap gutter={8} shift={-4}>
                    <DropdownMenu.SubTrigger
                      class={`${themed('tsqd-style-settings-sub-trigger')} tsqd-settings-menu-sub-trigger tsqd-settings-menu-sub-trigger-theme`}
                    >
                      <span>Theme</span>
                      <ChevronDown />
                    </DropdownMenu.SubTrigger>
                    <DropdownMenu.Portal
                      ref={(el) => setupPortal(el as HTMLDivElement)}
                      mount={
                        pip().pipWindow
                          ? pip().pipWindow!.document.body
                          : document.body
                      }
                    >
                      <DropdownMenu.SubContent
                        dir="ltr"
                        class={`${themed('tsqd-style-settings-menu')} tsqd-settings-submenu`}
                      >
                        <DropdownMenu.RadioGroup
                          value={props.localStore.theme_preference}
                          onChange={(value) => {
                            props.setLocalStore('theme_preference', value)
                          }}
                          aria-label="Theme preference"
                        >
                          <DropdownMenu.RadioItem
                            value="light"
                            class={`${themed('tsqd-style-settings-sub-button')} tsqd-settings-menu-position-btn tsqd-settings-menu-position-btn-top`}
                          >
                            <span>Light</span>
                            <Sun />
                          </DropdownMenu.RadioItem>
                          <DropdownMenu.RadioItem
                            value="dark"
                            class={`${themed('tsqd-style-settings-sub-button')} tsqd-settings-menu-position-btn tsqd-settings-menu-position-btn-bottom`}
                          >
                            <span>Dark</span>
                            <Moon />
                          </DropdownMenu.RadioItem>
                          <DropdownMenu.RadioItem
                            value="system"
                            class={`${themed('tsqd-style-settings-sub-button')} tsqd-settings-menu-position-btn tsqd-settings-menu-position-btn-left`}
                          >
                            <span>System</span>
                            <Monitor />
                          </DropdownMenu.RadioItem>
                        </DropdownMenu.RadioGroup>
                      </DropdownMenu.SubContent>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Sub>
                  <DropdownMenu.Sub overlap gutter={8} shift={-4}>
                    <DropdownMenu.SubTrigger
                      class={`${themed('tsqd-style-settings-sub-trigger')} tsqd-settings-menu-sub-trigger tsqd-settings-menu-sub-trigger-disabled-queries`}
                    >
                      <span>Disabled Queries</span>
                      <ChevronDown />
                    </DropdownMenu.SubTrigger>
                    <DropdownMenu.Portal
                      ref={(el) => setupPortal(el as HTMLDivElement)}
                      mount={
                        pip().pipWindow
                          ? pip().pipWindow!.document.body
                          : document.body
                      }
                    >
                      <DropdownMenu.SubContent
                        dir="ltr"
                        class={`${themed('tsqd-style-settings-menu')} tsqd-settings-submenu`}
                      >
                        <DropdownMenu.RadioGroup
                          value={hideDisabledQueries() ? 'true' : 'false'}
                          aria-label="Hide disabled queries setting"
                          onChange={(value) =>
                            props.setLocalStore('hideDisabledQueries', value)
                          }
                        >
                          <DropdownMenu.RadioItem
                            value="false"
                            class={`${themed('tsqd-style-settings-sub-button')} tsqd-settings-menu-position-btn tsqd-settings-menu-position-btn-show`}
                          >
                            <span>Show</span>
                            <Show when={!hideDisabledQueries()}>
                              <CheckCircle />
                            </Show>
                          </DropdownMenu.RadioItem>
                          <DropdownMenu.RadioItem
                            value="true"
                            class={`${themed('tsqd-style-settings-sub-button')} tsqd-settings-menu-position-btn tsqd-settings-menu-position-btn-hide`}
                          >
                            <span>Hide</span>
                            <Show when={hideDisabledQueries()}>
                              <CheckCircle />
                            </Show>
                          </DropdownMenu.RadioItem>
                        </DropdownMenu.RadioGroup>
                      </DropdownMenu.SubContent>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Sub>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
        <Show when={selectedView() === 'queries'}>
          <Show when={query_cache()} keyed>
            {(_cache) => (
              <VirtualList
                each={queries()}
                getKey={(query) => query.queryHash}
                class="tsqd-style-overflow-query-container tsqd-queries-overflow-container"
                contentClass="tsqd-queries-container"
              >
                {(query) => <QueryRow query={query()} />}
              </VirtualList>
            )}
          </Show>
        </Show>
        <Show when={selectedView() === 'mutations'}>
          <Show when={mutation_cache()} keyed>
            {(_cache) => (
              <VirtualList
                each={mutations()}
                getKey={(mutation) => mutation.mutationId}
                class="tsqd-style-overflow-query-container tsqd-mutations-overflow-container"
                contentClass="tsqd-mutations-container"
              >
                {(mutation) => <MutationRow mutation={mutation()} />}
              </VirtualList>
            )}
          </Show>
        </Show>
      </div>
      <Show when={selectedView() === 'queries' && selectedQueryHash()}>
        <QueryDetails
          initialSearch={
            filterScope() !== 'key' ? props.localStore.filter : undefined
          }
        />
      </Show>

      <Show when={selectedView() === 'mutations' && selectedMutationId()}>
        <MutationDetails
          initialSearch={
            filterScope() !== 'key'
              ? props.localStore.mutationFilter
              : undefined
          }
        />
      </Show>
    </>
  )
}

const QueryRow: Component<{ query: Query }> = (props) => {
  const { selectedQueryHash, setSelectedQueryHash } = useDevtoolsState()

  const theme = useTheme()
  const themed = createThemed(theme)

  const queryState = createSubscribeToQueryCacheBatcher(
    (queryCache) => queryCache().get(props.query.queryHash)?.state,
    true,
    (e) => e.query.queryHash === props.query.queryHash,
  )

  const isDisabled = createSubscribeToQueryCacheBatcher(
    (queryCache) =>
      queryCache().get(props.query.queryHash)?.isDisabled() ?? false,
    true,
    (e) => e.query.queryHash === props.query.queryHash,
  )

  const isStatic = createSubscribeToQueryCacheBatcher(
    (queryCache) =>
      queryCache().get(props.query.queryHash)?.isStatic() ?? false,
    true,
    (e) => e.query.queryHash === props.query.queryHash,
  )

  const isStale = createSubscribeToQueryCacheBatcher(
    (queryCache) => queryCache().get(props.query.queryHash)?.isStale() ?? false,
    true,
    (e) => e.query.queryHash === props.query.queryHash,
  )

  const observers = createSubscribeToQueryCacheBatcher(
    (queryCache) =>
      queryCache().get(props.query.queryHash)?.getObserversCount() ?? 0,
    true,
    (e) => e.query.queryHash === props.query.queryHash,
  )

  const color = createMemo(() =>
    getQueryStatusColor({
      queryState: queryState(),
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
        class={`${themed('tsqd-style-query-row')} ${selectedQueryHash() === props.query.queryHash ? themed('tsqd-style-selected-query-row') : ''} tsqd-query-row`}
        aria-label={`Query key ${props.query.queryHash}${isDisabled() ? ', disabled' : ''}${isStatic() ? ', static' : ''}`}
      >
        <div
          class={`${themed(`tsqd-style-observer-count-${color()}`)} tsqd-query-observer-count`}
        >
          {observers()}
        </div>
        <code class="tsqd-query-hash">{props.query.queryHash}</code>
        <Show when={isDisabled()}>
          <div class="tsqd-query-disabled-indicator" aria-hidden="true">
            disabled
          </div>
        </Show>
        <Show when={isStatic()}>
          <div class="tsqd-query-static-indicator" aria-hidden="true">
            static
          </div>
        </Show>
      </button>
    </Show>
  )
}

const MutationRow: Component<{ mutation: Mutation }> = (props) => {
  const { selectedMutationId, setSelectedMutationId } = useDevtoolsState()

  const theme = useTheme()
  const themed = createThemed(theme)

  const mutationState = createSubscribeToMutationCacheBatcher(
    () => props.mutation.state,
  )

  const isPaused = createSubscribeToMutationCacheBatcher(
    () => props.mutation.state.isPaused,
  )

  const status = createSubscribeToMutationCacheBatcher(
    () => props.mutation.state.status,
  )

  const color = createMemo(() =>
    getMutationStatusColor({
      isPaused: isPaused(),
      status: status(),
    }),
  )

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
        class={`${themed('tsqd-style-query-row')} ${selectedMutationId() === props.mutation.mutationId ? themed('tsqd-style-selected-query-row') : ''} tsqd-query-row`}
        aria-label={`Mutation submitted at ${new Date(
          props.mutation.state.submittedAt,
        ).toLocaleString()}`}
      >
        <div
          class={`${themed(`tsqd-style-observer-count-${color()}`)} tsqd-query-observer-count`}
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
  const counts = createSubscribeToQueryCacheBatcher((queryCache) => {
    const tally = { fresh: 0, fetching: 0, paused: 0, stale: 0, inactive: 0 }
    for (const query of queryCache().getAll()) {
      tally[getQueryStatusLabel(query)]++
    }
    return tally
  })

  return (
    <div class="tsqd-style-query-status-container tsqd-query-status-container">
      <QueryStatus label="Fresh" color="green" count={counts().fresh} />
      <QueryStatus label="Fetching" color="blue" count={counts().fetching} />
      <QueryStatus label="Paused" color="purple" count={counts().paused} />
      <QueryStatus label="Stale" color="yellow" count={counts().stale} />
      <QueryStatus label="Inactive" color="gray" count={counts().inactive} />
    </div>
  )
}

const MutationStatusCount: Component = () => {
  const counts = createSubscribeToMutationCacheBatcher((mutationCache) => {
    const tally = { green: 0, yellow: 0, purple: 0, red: 0, gray: 0 }
    for (const mutation of mutationCache().getAll()) {
      tally[getMutationStatusColor(mutation.state)]++
    }
    return tally
  })

  return (
    <div class="tsqd-style-query-status-container tsqd-query-status-container">
      <QueryStatus label="Paused" color="purple" count={counts().purple} />
      <QueryStatus label="Pending" color="yellow" count={counts().yellow} />
      <QueryStatus label="Success" color="green" count={counts().green} />
      <QueryStatus label="Error" color="red" count={counts().red} />
    </div>
  )
}

const QueryStatus: Component<QueryStatusProps> = (props) => {
  const { selectedQueryHash, panelWidth } = useDevtoolsState()

  const theme = useTheme()
  const themed = createThemed(theme)

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
      aria-label={`${props.label}: ${props.count}`}
      class={`${themed('tsqd-style-query-status-tag')} ${!showLabel() ? themed('tsqd-style-query-status-tag-clickable') : ''} tsqd-query-status-tag tsqd-query-status-tag-${props.label.toLowerCase()}`}
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
          class={`${themed('tsqd-style-status-tooltip')} tsqd-query-status-tooltip`}
        >
          {props.label}
        </div>
      </Show>
      <span
        aria-hidden="true"
        class={`tsqd-style-query-status-dot tsqd-style-query-status-dot-${props.color} tsqd-query-status-tag-dot`}
      />
      <Show when={showLabel()}>
        <span class="tsqd-style-query-status-tag-label tsqd-query-status-tag-label">
          {props.label}
        </span>
      </Show>
      <span
        class={`${themed('tsqd-style-query-status-count')} ${props.count > 0 && props.color !== 'gray' ? themed(`tsqd-style-query-status-count-${props.color}`) : ''} tsqd-query-status-tag-count`}
      >
        {props.count}
      </span>
    </button>
  )
}

const QueryDetails = (props: { initialSearch?: string }) => {
  const { selectedQueryHash, setSelectedQueryHash } = useDevtoolsState()

  const theme = useTheme()
  const themed = createThemed(theme)

  const queryClient = useQueryDevtoolsContext().client

  const [restoringLoading, setRestoringLoading] = createSignal(false)
  const [dataMode, setDataMode] = createSignal<'view' | 'edit'>('view')
  const [dataEditError, setDataEditError] = createSignal<boolean>(false)

  const errorTypes = createMemo(() => {
    return useQueryDevtoolsContext().errorTypes || []
  })

  const activeQuery = createSubscribeToQueryCacheBatcher(
    (queryCache) => queryCache().get(selectedQueryHash() ?? ''),
    false,
  )

  const activeQueryFresh = createSubscribeToQueryCacheBatcher((queryCache) => {
    return queryCache().get(selectedQueryHash() ?? '')
  }, false)

  const activeQueryState = createSubscribeToQueryCacheBatcher(
    (queryCache) => queryCache().get(selectedQueryHash() ?? '')?.state,
    false,
  )

  const activeQueryStateData = createSubscribeToQueryCacheBatcher(
    (queryCache) => {
      return queryCache().get(selectedQueryHash() ?? '')?.state.data
    },
    false,
  )

  const statusLabel = createSubscribeToQueryCacheBatcher((queryCache) => {
    const query = queryCache().get(selectedQueryHash() ?? '')
    if (!query) return 'inactive'
    return getQueryStatusLabel(query)
  })

  const queryStatus = createSubscribeToQueryCacheBatcher((queryCache) => {
    const query = queryCache().get(selectedQueryHash() ?? '')
    if (!query) return 'pending'
    return query.state.status
  })

  const observerCount = createSubscribeToQueryCacheBatcher(
    (queryCache) =>
      queryCache()
        .get(selectedQueryHash() ?? '')
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
      data: undefined,
      status: 'error',
      error,
      fetchMeta: {
        ...activeQueryVal.state.fetchMeta,
        __previousQueryOptions,
      } as any,
    })
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

  return (
    <Show when={activeQuery() && activeQueryState()}>
      <div
        class={`${themed('tsqd-style-details-container')} tsqd-query-details-container`}
      >
        <div
          role="heading"
          aria-level="2"
          class={`${themed('tsqd-style-details-header')} tsqd-query-details-header`}
        >
          Query Details
        </div>
        <div class="tsqd-style-details-body tsqd-query-details-summary-container">
          <div class="tsqd-query-details-summary">
            <pre>
              <code>{displayValue(activeQuery()!.queryKey, true)}</code>
            </pre>
            <span
              class={`tsqd-style-query-details-status ${themed(`tsqd-style-details-status-${color()}`)}`}
              role="status"
              aria-live="polite"
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
        <div
          role="heading"
          aria-level="2"
          class={`${themed('tsqd-style-details-header')} tsqd-query-details-header`}
        >
          Actions
        </div>
        <div
          class={`${themed('tsqd-style-actions-body')} tsqd-query-details-actions-container`}
        >
          <button
            class={`${themed('tsqd-style-action-blue')} tsqd-query-details-actions-btn tsqd-query-details-action-refetch`}
            onClick={handleRefetch}
            disabled={statusLabel() === 'fetching'}
          >
            <span
              aria-hidden="true"
              class={themed('tsqd-style-action-dot-blue')}
            ></span>
            Refetch
          </button>
          <button
            class={`${themed('tsqd-style-action-yellow')} tsqd-query-details-actions-btn tsqd-query-details-action-invalidate`}
            onClick={() => {
              sendDevToolsEvent({
                type: 'INVALIDATE',
                queryHash: activeQuery()?.queryHash,
              })
              queryClient.invalidateQueries({
                queryKey: activeQuery()?.queryKey,
                exact: true,
              })
            }}
            disabled={queryStatus() === 'pending'}
          >
            <span
              aria-hidden="true"
              class={themed('tsqd-style-action-dot-yellow')}
            ></span>
            Invalidate
          </button>
          <button
            class={`${themed('tsqd-style-action-gray')} tsqd-query-details-actions-btn tsqd-query-details-action-reset`}
            onClick={() => {
              sendDevToolsEvent({
                type: 'RESET',
                queryHash: activeQuery()?.queryHash,
              })
              queryClient.resetQueries({
                queryKey: activeQuery()?.queryKey,
                exact: true,
              })
            }}
            disabled={queryStatus() === 'pending'}
          >
            <span
              aria-hidden="true"
              class={themed('tsqd-style-action-dot-gray')}
            ></span>
            Reset
          </button>
          <button
            class={`${themed('tsqd-style-action-pink')} tsqd-query-details-actions-btn tsqd-query-details-action-remove`}
            onClick={() => {
              sendDevToolsEvent({
                type: 'REMOVE',
                queryHash: activeQuery()?.queryHash,
              })
              queryClient.removeQueries({
                queryKey: activeQuery()?.queryKey,
                exact: true,
              })
              setSelectedQueryHash(null)
            }}
            disabled={statusLabel() === 'fetching'}
          >
            <span
              aria-hidden="true"
              class={themed('tsqd-style-action-dot-pink')}
            ></span>
            Remove
          </button>
          <button
            class={`${themed('tsqd-style-action-cyan')} tsqd-query-details-actions-btn tsqd-query-details-action-loading`}
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
                })
              }
            }}
          >
            <span
              aria-hidden="true"
              class={themed('tsqd-style-action-dot-cyan')}
            ></span>
            {queryStatus() === 'pending' ? 'Restore' : 'Trigger'} Loading
          </button>
          <Show when={errorTypes().length === 0 || queryStatus() === 'error'}>
            <button
              class={`${themed('tsqd-style-action-red')} tsqd-query-details-actions-btn tsqd-query-details-action-error`}
              onClick={() => {
                if (!activeQuery()!.state.error) {
                  triggerError()
                } else {
                  sendDevToolsEvent({
                    type: 'RESTORE_ERROR',
                    queryHash: activeQuery()?.queryHash,
                  })
                  queryClient.resetQueries({
                    queryKey: activeQuery()?.queryKey,
                  })
                }
              }}
              disabled={queryStatus() === 'pending'}
            >
              <span
                aria-hidden="true"
                class={themed('tsqd-style-action-dot-red')}
              ></span>
              {queryStatus() === 'error' ? 'Restore' : 'Trigger'} Error
            </button>
          </Show>
          <Show
            when={!(errorTypes().length === 0 || queryStatus() === 'error')}
          >
            <div
              class={`${themed('tsqd-style-actions-select')} tsqd-query-details-actions-btn tsqd-query-details-action-error-multiple`}
            >
              <span
                aria-hidden="true"
                class="tsqd-style-action-select-dot"
              ></span>
              Trigger Error
              <select
                disabled={queryStatus() === 'pending'}
                aria-label="Select error type to trigger"
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
        <div
          role="heading"
          aria-level="2"
          class={`${themed('tsqd-style-details-header')} tsqd-query-details-header`}
        >
          Data {dataMode() === 'view' ? 'Explorer' : 'Editor'}
        </div>
        <Show when={dataMode() === 'view'}>
          <div
            style={{
              padding: tokens.size[2],
            }}
            class="tsqd-query-details-explorer-container tsqd-query-details-data-explorer"
          >
            <SearchableExplorer
              searchKey={activeQuery()}
              initialSearch={props.initialSearch}
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
            class={`${themed('tsqd-style-devtools-edit-form')} tsqd-query-details-data-editor`}
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
              aria-label="Edit query data as JSON"
              class={themed('tsqd-style-devtools-edit-textarea')}
              onFocus={() => setDataEditError(false)}
              data-error={dataEditError()}
              value={JSON.stringify(activeQueryStateData(), null, 2)}
            ></textarea>
            <div class="tsqd-style-devtools-edit-form-actions">
              <span class={themed('tsqd-style-devtools-edit-form-error')}>
                {dataEditError() ? 'Invalid Value' : ''}
              </span>
              <div class="tsqd-style-devtools-edit-form-action-container">
                <button
                  class={`${themed('tsqd-style-devtools-edit-form-action')} ${themed('tsqd-style-action-gray')}`}
                  type="button"
                  onClick={() => setDataMode('view')}
                >
                  Cancel
                </button>
                <button
                  class={`${themed('tsqd-style-devtools-edit-form-action')} ${themed('tsqd-style-action-blue')}`}
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        </Show>
        <div
          role="heading"
          aria-level="2"
          class={`${themed('tsqd-style-details-header')} tsqd-query-details-header`}
        >
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

const MutationDetails = (props: { initialSearch?: string }) => {
  const { selectedMutationId } = useDevtoolsState()

  const theme = useTheme()
  const themed = createThemed(theme)

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

  const matchingSearch = (value: unknown) =>
    props.initialSearch && matchesData(value, props.initialSearch.toLowerCase())
      ? props.initialSearch
      : undefined

  return (
    <Show when={activeMutation()}>
      <div
        class={`${themed('tsqd-style-details-container')} tsqd-query-details-container`}
      >
        <div
          role="heading"
          aria-level="2"
          class={`${themed('tsqd-style-details-header')} tsqd-query-details-header`}
        >
          Mutation Details
        </div>
        <div class="tsqd-style-details-body tsqd-query-details-summary-container">
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
              class={`tsqd-style-query-details-status ${themed(`tsqd-style-details-status-${color()}`)}`}
              role="status"
              aria-live="polite"
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
        <div
          role="heading"
          aria-level="2"
          class={`${themed('tsqd-style-details-header')} tsqd-query-details-header`}
        >
          Variables Details
        </div>
        <div
          style={{
            padding: tokens.size[2],
          }}
          class="tsqd-query-details-explorer-container tsqd-query-details-query-explorer"
        >
          <SearchableExplorer
            searchKey={activeMutation()}
            initialSearch={matchingSearch(activeMutation()!.state.variables)}
            label="Variables"
            defaultExpanded={['Variables']}
            value={activeMutation()!.state.variables}
          />
        </div>
        <div
          role="heading"
          aria-level="2"
          class={`${themed('tsqd-style-details-header')} tsqd-query-details-header`}
        >
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
        <div
          role="heading"
          aria-level="2"
          class={`${themed('tsqd-style-details-header')} tsqd-query-details-header`}
        >
          Data Explorer
        </div>
        <div
          style={{
            padding: tokens.size[2],
          }}
          class="tsqd-query-details-explorer-container tsqd-query-details-query-explorer"
        >
          <SearchableExplorer
            searchKey={activeMutation()}
            initialSearch={matchingSearch(activeMutation()!.state.data)}
            label="Data"
            defaultExpanded={['Data']}
            value={activeMutation()!.state.data}
          />
        </div>
        <div
          role="heading"
          aria-level="2"
          class={`${themed('tsqd-style-details-header')} tsqd-query-details-header`}
        >
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

const setupQueryCacheSubscription = () => {
  const { queryCacheSubscriptions } = useDevtoolsSubscriptions()
  const queryCache = createMemo(() => {
    const client = useQueryDevtoolsContext().client
    return client.getQueryCache()
  })

  createEffect(() => {
    const cache = queryCache()
    const unsubscribe = cache.subscribe((event) => {
      batch(() => {
        queryCacheSubscriptions.notify(() => cache, event)
      })
    })
    onCleanup(unsubscribe)
  })
}

const createSubscribeToQueryCacheBatcher = <T,>(
  callback: (
    queryCache: Accessor<QueryCache>,
    // oxlint-disable-next-line typescript/no-unsafe-function-type -- matches the 'Exclude<T, Function>' that Solid's 'Setter' accepts
  ) => Exclude<T, Function>,
  equalityCheck: boolean = true,
  shouldUpdate: (event: QueryCacheNotifyEvent) => boolean = () => true,
) => {
  const { queryCacheSubscriptions } = useDevtoolsSubscriptions()
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

  queryCacheSubscriptions.register(callback, setValue, shouldUpdate)

  return value
}

const setupMutationCacheSubscription = () => {
  const { mutationCacheSubscriptions } = useDevtoolsSubscriptions()
  const mutationCache = createMemo(() => {
    const client = useQueryDevtoolsContext().client
    return client.getMutationCache()
  })

  createEffect(() => {
    const cache = mutationCache()
    let active = true
    const unsubscribe = cache.subscribe((event) => {
      mutationCacheSubscriptions.notify(
        () => cache,
        event,
        (update) => {
          queueMicrotask(() => {
            if (active) update()
          })
        },
      )
    })
    onCleanup(() => {
      active = false
      unsubscribe()
    })
  })
}

const createSubscribeToMutationCacheBatcher = <T,>(
  callback: (
    queryCache: Accessor<MutationCache>,
    // oxlint-disable-next-line typescript/no-unsafe-function-type -- matches the 'Exclude<T, Function>' that Solid's 'Setter' accepts
  ) => Exclude<T, Function>,
  equalityCheck: boolean = true,
  shouldUpdate: (event: MutationCacheNotifyEvent) => boolean = () => true,
) => {
  const { mutationCacheSubscriptions } = useDevtoolsSubscriptions()
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

  mutationCacheSubscriptions.register(callback, setValue, shouldUpdate)

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
