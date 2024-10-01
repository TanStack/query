import { serialize, stringify } from 'superjson'
import { clsx as cx } from 'clsx'
import { Index, Match, Show, Switch, createMemo, createSignal } from 'solid-js'
import { Key } from '@solid-primitives/keyed'
import * as goober from 'goober'
import { tokens } from './theme'
import {
  deleteNestedDataByPath,
  displayValue,
  updateNestedDataByPath,
} from './utils'
import {
  Check,
  CopiedCopier,
  Copier,
  ErrorCopier,
  List,
  Pencil,
  Trash,
} from './icons'
import { useQueryDevtoolsContext, useTheme } from './contexts'
import type { Query } from '@tanstack/query-core'

/**
 * Chunk elements in the array by size
 *
 * when the array cannot be chunked evenly by size, the last chunk will be
 * filled with the remaining elements
 *
 * @example
 * chunkArray(['a','b', 'c', 'd', 'e'], 2) // returns [['a','b'], ['c', 'd'], ['e']]
 */
function chunkArray<T extends { label: string; value: unknown }>(
  array: Array<T>,
  size: number,
): Array<Array<T>> {
  if (size < 1) return []
  let i = 0
  const result: Array<Array<T>> = []
  while (i < array.length) {
    result.push(array.slice(i, i + size))
    i = i + size
  }
  return result
}

const Expander = (props: { expanded: boolean }) => {
  const theme = useTheme()
  const css = useQueryDevtoolsContext().shadowDOMTarget
    ? goober.css.bind({ target: useQueryDevtoolsContext().shadowDOMTarget })
    : goober.css
  const styles = createMemo(() => {
    return theme() === 'dark' ? darkStyles(css) : lightStyles(css)
  })

  return (
    <span
      class={cx(
        styles().expander,
        css`
          transform: rotate(${props.expanded ? 90 : 0}deg);
        `,
        props.expanded &&
          css`
            & svg {
              top: -1px;
            }
          `,
      )}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 12L10 8L6 4"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
  )
}

type CopyState = 'NoCopy' | 'SuccessCopy' | 'ErrorCopy'
const CopyButton = (props: { value: unknown }) => {
  const theme = useTheme()
  const css = useQueryDevtoolsContext().shadowDOMTarget
    ? goober.css.bind({ target: useQueryDevtoolsContext().shadowDOMTarget })
    : goober.css
  const styles = createMemo(() => {
    return theme() === 'dark' ? darkStyles(css) : lightStyles(css)
  })
  const [copyState, setCopyState] = createSignal<CopyState>('NoCopy')

  return (
    <button
      class={styles().actionButton}
      title="Copy object to clipboard"
      aria-label={`${
        copyState() === 'NoCopy'
          ? 'Copy object to clipboard'
          : copyState() === 'SuccessCopy'
            ? 'Object copied to clipboard'
            : 'Error copying object to clipboard'
      }`}
      onClick={
        copyState() === 'NoCopy'
          ? () => {
              navigator.clipboard.writeText(stringify(props.value)).then(
                () => {
                  setCopyState('SuccessCopy')
                  setTimeout(() => {
                    setCopyState('NoCopy')
                  }, 1500)
                },
                (err) => {
                  console.error('Failed to copy: ', err)
                  setCopyState('ErrorCopy')
                  setTimeout(() => {
                    setCopyState('NoCopy')
                  }, 1500)
                },
              )
            }
          : undefined
      }
    >
      <Switch>
        <Match when={copyState() === 'NoCopy'}>
          <Copier />
        </Match>
        <Match when={copyState() === 'SuccessCopy'}>
          <CopiedCopier theme={theme()} />
        </Match>
        <Match when={copyState() === 'ErrorCopy'}>
          <ErrorCopier />
        </Match>
      </Switch>
    </button>
  )
}

const ClearArrayButton = (props: {
  dataPath: Array<string>
  activeQuery: Query
}) => {
  const theme = useTheme()
  const css = useQueryDevtoolsContext().shadowDOMTarget
    ? goober.css.bind({ target: useQueryDevtoolsContext().shadowDOMTarget })
    : goober.css
  const styles = createMemo(() => {
    return theme() === 'dark' ? darkStyles(css) : lightStyles(css)
  })
  const queryClient = useQueryDevtoolsContext().client

  return (
    <button
      class={styles().actionButton}
      title={'Remove all items'}
      aria-label={'Remove all items'}
      onClick={() => {
        const oldData = props.activeQuery.state.data
        const newData = updateNestedDataByPath(oldData, props.dataPath, [])
        queryClient.setQueryData(props.activeQuery.queryKey, newData)
      }}
    >
      <List />
    </button>
  )
}

const DeleteItemButton = (props: {
  dataPath: Array<string>
  activeQuery: Query
}) => {
  const theme = useTheme()
  const css = useQueryDevtoolsContext().shadowDOMTarget
    ? goober.css.bind({ target: useQueryDevtoolsContext().shadowDOMTarget })
    : goober.css
  const styles = createMemo(() => {
    return theme() === 'dark' ? darkStyles(css) : lightStyles(css)
  })
  const queryClient = useQueryDevtoolsContext().client

  return (
    <button
      class={cx(styles().actionButton)}
      title={'Delete item'}
      aria-label={'Delete item'}
      onClick={() => {
        const oldData = props.activeQuery.state.data
        const newData = deleteNestedDataByPath(oldData, props.dataPath)
        queryClient.setQueryData(props.activeQuery.queryKey, newData)
      }}
    >
      <Trash />
    </button>
  )
}

const ToggleValueButton = (props: {
  dataPath: Array<string>
  activeQuery: Query
  value: boolean
}) => {
  const theme = useTheme()
  const css = useQueryDevtoolsContext().shadowDOMTarget
    ? goober.css.bind({ target: useQueryDevtoolsContext().shadowDOMTarget })
    : goober.css
  const styles = createMemo(() => {
    return theme() === 'dark' ? darkStyles(css) : lightStyles(css)
  })
  const queryClient = useQueryDevtoolsContext().client

  return (
    <button
      class={cx(
        styles().actionButton,
        css`
          width: ${tokens.size[3.5]};
          height: ${tokens.size[3.5]};
        `,
      )}
      title={'Toggle value'}
      aria-label={'Toggle value'}
      onClick={() => {
        const oldData = props.activeQuery.state.data
        const newData = updateNestedDataByPath(
          oldData,
          props.dataPath,
          !props.value,
        )
        queryClient.setQueryData(props.activeQuery.queryKey, newData)
      }}
    >
      <Check theme={theme()} checked={props.value} />
    </button>
  )
}

type ExplorerProps = {
  editable?: boolean
  label: string
  value: unknown
  defaultExpanded?: Array<string>
  dataPath?: Array<string>
  activeQuery?: Query
  itemsDeletable?: boolean
  onEdit?: () => void
}

function isIterable(x: any): x is Iterable<unknown> {
  return Symbol.iterator in x
}

export default function Explorer(props: ExplorerProps) {
  const theme = useTheme()
  const css = useQueryDevtoolsContext().shadowDOMTarget
    ? goober.css.bind({ target: useQueryDevtoolsContext().shadowDOMTarget })
    : goober.css
  const styles = createMemo(() => {
    return theme() === 'dark' ? darkStyles(css) : lightStyles(css)
  })
  const queryClient = useQueryDevtoolsContext().client

  const [expanded, setExpanded] = createSignal(
    (props.defaultExpanded || []).includes(props.label),
  )
  const toggleExpanded = () => setExpanded((old) => !old)
  const [expandedPages, setExpandedPages] = createSignal<Array<number>>([])

  const subEntries = createMemo(() => {
    if (Array.isArray(props.value)) {
      return props.value.map((d, i) => ({
        label: i.toString(),
        value: d,
      }))
    } else if (
      props.value !== null &&
      typeof props.value === 'object' &&
      isIterable(props.value) &&
      typeof props.value[Symbol.iterator] === 'function'
    ) {
      if (props.value instanceof Map) {
        return Array.from(props.value, ([key, val]) => ({
          label: key,
          value: val,
        }))
      }
      return Array.from(props.value, (val, i) => ({
        label: i.toString(),
        value: val,
      }))
    } else if (typeof props.value === 'object' && props.value !== null) {
      return Object.entries(props.value).map(([key, val]) => ({
        label: key,
        value: val,
      }))
    }
    return []
  })

  const type = createMemo<string>(() => {
    if (Array.isArray(props.value)) {
      return 'array'
    } else if (
      props.value !== null &&
      typeof props.value === 'object' &&
      isIterable(props.value) &&
      typeof props.value[Symbol.iterator] === 'function'
    ) {
      return 'Iterable'
    } else if (typeof props.value === 'object' && props.value !== null) {
      return 'object'
    }
    return typeof props.value
  })

  const subEntryPages = createMemo(() => chunkArray(subEntries(), 100))

  const currentDataPath = props.dataPath ?? []

  return (
    <div class={styles().entry}>
      <Show when={subEntryPages().length}>
        <div class={styles().expanderButtonContainer}>
          <button
            class={styles().expanderButton}
            onClick={() => toggleExpanded()}
          >
            <Expander expanded={expanded()} /> <span>{props.label}</span>{' '}
            <span class={styles().info}>
              {String(type()).toLowerCase() === 'iterable' ? '(Iterable) ' : ''}
              {subEntries().length} {subEntries().length > 1 ? `items` : `item`}
            </span>
          </button>
          <Show when={props.editable}>
            <div class={styles().actions}>
              <CopyButton value={props.value} />

              <Show
                when={props.itemsDeletable && props.activeQuery !== undefined}
              >
                <DeleteItemButton
                  activeQuery={props.activeQuery!}
                  dataPath={currentDataPath}
                />
              </Show>

              <Show
                when={type() === 'array' && props.activeQuery !== undefined}
              >
                <ClearArrayButton
                  activeQuery={props.activeQuery!}
                  dataPath={currentDataPath}
                />
              </Show>

              <Show when={!!props.onEdit && !serialize(props.value).meta}>
                <button
                  class={styles().actionButton}
                  title={'Bulk Edit Data'}
                  aria-label={'Bulk Edit Data'}
                  onClick={() => {
                    props.onEdit?.()
                  }}
                >
                  <Pencil />
                </button>
              </Show>
            </div>
          </Show>
        </div>
        <Show when={expanded()}>
          <Show when={subEntryPages().length === 1}>
            <div class={styles().subEntry}>
              <Key each={subEntries()} by={(item) => item.label}>
                {(entry) => {
                  return (
                    <Explorer
                      defaultExpanded={props.defaultExpanded}
                      label={entry().label}
                      value={entry().value}
                      editable={props.editable}
                      dataPath={[...currentDataPath, entry().label]}
                      activeQuery={props.activeQuery}
                      itemsDeletable={
                        type() === 'array' ||
                        type() === 'Iterable' ||
                        type() === 'object'
                      }
                    />
                  )
                }}
              </Key>
            </div>
          </Show>
          <Show when={subEntryPages().length > 1}>
            <div class={styles().subEntry}>
              <Index each={subEntryPages()}>
                {(entries, index) => (
                  <div>
                    <div class={styles().entry}>
                      <button
                        onClick={() =>
                          setExpandedPages((old) =>
                            old.includes(index)
                              ? old.filter((d) => d !== index)
                              : [...old, index],
                          )
                        }
                        class={styles().expanderButton}
                      >
                        <Expander expanded={expandedPages().includes(index)} />{' '}
                        [{index * 100}...
                        {index * 100 + 100 - 1}]
                      </button>
                      <Show when={expandedPages().includes(index)}>
                        <div class={styles().subEntry}>
                          <Key each={entries()} by={(entry) => entry.label}>
                            {(entry) => (
                              <Explorer
                                defaultExpanded={props.defaultExpanded}
                                label={entry().label}
                                value={entry().value}
                                editable={props.editable}
                                dataPath={[...currentDataPath, entry().label]}
                                activeQuery={props.activeQuery}
                              />
                            )}
                          </Key>
                        </div>
                      </Show>
                    </div>
                  </div>
                )}
              </Index>
            </div>
          </Show>
        </Show>
      </Show>
      <Show when={subEntryPages().length === 0}>
        <div class={styles().row}>
          <span class={styles().label}>{props.label}:</span>
          <Show
            when={
              props.editable &&
              props.activeQuery !== undefined &&
              (type() === 'string' ||
                type() === 'number' ||
                type() === 'boolean')
            }
            fallback={
              <span class={styles().value}>{displayValue(props.value)}</span>
            }
          >
            <Show
              when={
                props.editable &&
                props.activeQuery !== undefined &&
                (type() === 'string' || type() === 'number')
              }
            >
              <input
                type={type() === 'number' ? 'number' : 'text'}
                class={cx(styles().value, styles().editableInput)}
                value={props.value as string | number}
                onChange={(changeEvent) => {
                  const oldData = props.activeQuery!.state.data

                  const newData = updateNestedDataByPath(
                    oldData,
                    currentDataPath,
                    type() === 'number'
                      ? changeEvent.target.valueAsNumber
                      : changeEvent.target.value,
                  )

                  queryClient.setQueryData(props.activeQuery!.queryKey, newData)
                }}
              />
            </Show>

            <Show when={type() === 'boolean'}>
              <span
                class={cx(
                  styles().value,
                  styles().actions,
                  styles().editableInput,
                )}
              >
                <ToggleValueButton
                  activeQuery={props.activeQuery!}
                  dataPath={currentDataPath}
                  value={props.value as boolean}
                />
                {displayValue(props.value)}
              </span>
            </Show>
          </Show>

          <Show
            when={
              props.editable &&
              props.itemsDeletable &&
              props.activeQuery !== undefined
            }
          >
            <DeleteItemButton
              activeQuery={props.activeQuery!}
              dataPath={currentDataPath}
            />
          </Show>
        </div>
      </Show>
    </div>
  )
}

const stylesFactory = (
  theme: 'light' | 'dark',
  css: (typeof goober)['css'],
) => {
  const { colors, font, size, border } = tokens
  const t = (light: string, dark: string) => (theme === 'light' ? light : dark)
  return {
    entry: css`
      & * {
        font-size: ${font.size.xs};
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
          'Liberation Mono', 'Courier New', monospace;
      }
      position: relative;
      outline: none;
      word-break: break-word;
    `,
    subEntry: css`
      margin: 0 0 0 0.5em;
      padding-left: 0.75em;
      border-left: 2px solid ${t(colors.gray[300], colors.darkGray[400])};
      /* outline: 1px solid ${colors.teal[400]}; */
    `,
    expander: css`
      & path {
        stroke: ${colors.gray[400]};
      }
      & svg {
        width: ${size[3]};
        height: ${size[3]};
      }
      display: inline-flex;
      align-items: center;
      transition: all 0.1s ease;
      /* outline: 1px solid ${colors.blue[400]}; */
    `,
    expanderButtonContainer: css`
      display: flex;
      align-items: center;
      line-height: ${size[4]};
      min-height: ${size[4]};
      gap: ${size[2]};
    `,
    expanderButton: css`
      cursor: pointer;
      color: inherit;
      font: inherit;
      outline: inherit;
      height: ${size[5]};
      background: transparent;
      border: none;
      padding: 0;
      display: inline-flex;
      align-items: center;
      gap: ${size[1]};
      position: relative;
      /* outline: 1px solid ${colors.green[400]}; */

      &:focus-visible {
        border-radius: ${border.radius.xs};
        outline: 2px solid ${colors.blue[800]};
      }

      & svg {
        position: relative;
        left: 1px;
      }
    `,
    info: css`
      color: ${t(colors.gray[500], colors.gray[500])};
      font-size: ${font.size.xs};
      margin-left: ${size[1]};
      /* outline: 1px solid ${colors.yellow[400]}; */
    `,
    label: css`
      color: ${t(colors.gray[700], colors.gray[300])};
      white-space: nowrap;
    `,
    value: css`
      color: ${t(colors.purple[600], colors.purple[400])};
      flex-grow: 1;
    `,
    actions: css`
      display: inline-flex;
      gap: ${size[2]};
      align-items: center;
    `,
    row: css`
      display: inline-flex;
      gap: ${size[2]};
      width: 100%;
      margin: ${size[0.25]} 0px;
      line-height: ${size[4.5]};
      align-items: center;
    `,
    editableInput: css`
      border: none;
      padding: ${size[0.5]} ${size[1]} ${size[0.5]} ${size[1.5]};
      flex-grow: 1;
      border-radius: ${border.radius.xs};
      background-color: ${t(colors.gray[200], colors.darkGray[500])};

      &:hover {
        background-color: ${t(colors.gray[300], colors.darkGray[600])};
      }
    `,
    actionButton: css`
      background-color: transparent;
      color: ${t(colors.gray[500], colors.gray[500])};
      border: none;
      display: inline-flex;
      padding: 0px;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      width: ${size[3]};
      height: ${size[3]};
      position: relative;
      z-index: 1;

      &:hover svg {
        color: ${t(colors.gray[600], colors.gray[400])};
      }

      &:focus-visible {
        border-radius: ${border.radius.xs};
        outline: 2px solid ${colors.blue[800]};
        outline-offset: 2px;
      }
    `,
  }
}

const lightStyles = (css: (typeof goober)['css']) => stylesFactory('light', css)
const darkStyles = (css: (typeof goober)['css']) => stylesFactory('dark', css)
