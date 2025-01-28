'use client'
import * as React from 'react'

import superjson from 'superjson'
import { displayValue, styled } from './utils'

export const Entry = styled('div', {
  fontFamily: 'Menlo, monospace',
  fontSize: '1em',
  lineHeight: '1.7',
  outline: 'none',
  wordBreak: 'break-word',
})

export const Label = styled('span', {
  color: 'white',
})

export const LabelButton = styled('button', {
  cursor: 'pointer',
  color: 'white',
})

export const ExpandButton = styled('button', {
  cursor: 'pointer',
  color: 'inherit',
  font: 'inherit',
  outline: 'inherit',
  background: 'transparent',
  border: 'none',
  padding: 0,
})

type CopyState = 'NoCopy' | 'SuccessCopy' | 'ErrorCopy'

export const CopyButton = ({ value }: { value: unknown }) => {
  const [copyState, setCopyState] = React.useState<CopyState>('NoCopy')

  return (
    <button
      onClick={
        copyState === 'NoCopy'
          ? () => {
              navigator.clipboard.writeText(superjson.stringify(value)).then(
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
      style={{
        cursor: 'pointer',
        color: 'inherit',
        font: 'inherit',
        outline: 'inherit',
        background: 'transparent',
        border: 'none',
        padding: 0,
      }}
    >
      {copyState === 'NoCopy' ? (
        <Copier />
      ) : copyState === 'SuccessCopy' ? (
        <CopiedCopier />
      ) : (
        <ErrorCopier />
      )}
    </button>
  )
}

export const Value = styled('span', (_props, theme) => ({
  color: theme.danger,
}))

export const SubEntries = styled('div', {
  marginLeft: '.1em',
  paddingLeft: '1em',
  borderLeft: '2px solid rgba(0,0,0,.15)',
})

export const Info = styled('span', {
  color: 'grey',
  fontSize: '.7em',
})

type ExpanderProps = {
  expanded: boolean
  style?: React.CSSProperties
}

export const Expander = ({ expanded, style = {} }: ExpanderProps) => (
  <span
    style={{
      display: 'inline-block',
      transition: 'all .1s ease',
      transform: `rotate(${expanded ? 90 : 0}deg) ${style.transform || ''}`,
      ...style,
    }}
  >
    ▶
  </span>
)

const Copier = () => (
  <span
    aria-label="Copy object to clipboard"
    title="Copy object to clipboard"
    style={{
      paddingLeft: '1em',
    }}
  >
    <svg height="12" viewBox="0 0 16 12" width="10">
      <path
        fill="currentColor"
        d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z"
      ></path>
      <path
        fill="currentColor"
        d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z"
      ></path>
    </svg>
  </span>
)

const ErrorCopier = () => (
  <span
    aria-label="Failed copying to clipboard"
    title="Failed copying to clipboard"
    style={{
      paddingLeft: '1em',
      display: 'flex',
      alignItems: 'center',
    }}
  >
    <svg height="12" viewBox="0 0 16 12" width="10" display="block">
      <path
        fill="red"
        d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"
      ></path>
    </svg>
    <span
      style={{
        color: 'red',
        fontSize: '12px',
        paddingLeft: '4px',
        position: 'relative',
        top: '2px',
      }}
    >
      See console
    </span>
  </span>
)

const CopiedCopier = () => (
  <span
    aria-label="Object copied to clipboard"
    title="Object copied to clipboard"
    style={{
      paddingLeft: '1em',
      display: 'inline-block',
      verticalAlign: 'middle',
    }}
  >
    <svg height="16" viewBox="0 0 16 16" width="16" display="block">
      <path
        fill="green"
        d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"
      ></path>
    </svg>
  </span>
)

type Entry = {
  label: string
}

type RendererProps = {
  handleEntry: (entry: Entry) => JSX.Element
  label?: string
  value: unknown
  subEntries: Entry[]
  subEntryPages: Entry[][]
  type: string
  expanded: boolean
  copyable: boolean
  toggleExpanded: () => void
  pageSize: number
}

/**
 * Chunk elements in the array by size
 *
 * when the array cannot be chunked evenly by size, the last chunk will be
 * filled with the remaining elements
 *
 * @example
 * chunkArray(['a','b', 'c', 'd', 'e'], 2) // returns [['a','b'], ['c', 'd'], ['e']]
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  if (size < 1) return []
  let i = 0
  const result: T[][] = []
  while (i < array.length) {
    result.push(array.slice(i, i + size))
    i = i + size
  }
  return result
}

type Renderer = (props: RendererProps) => JSX.Element

export const DefaultRenderer: Renderer = ({
  handleEntry,
  label,
  value,
  subEntries = [],
  subEntryPages = [],
  type,
  expanded = false,
  copyable = false,
  toggleExpanded,
  pageSize,
}) => {
  const [expandedPages, setExpandedPages] = React.useState<number[]>([])

  return (
    <Entry key={label}>
      {subEntryPages.length ? (
        <>
          <ExpandButton onClick={() => toggleExpanded()}>
            <Expander expanded={expanded} /> {label}{' '}
            <Info>
              {String(type).toLowerCase() === 'iterable' ? '(Iterable) ' : ''}
              {subEntries.length} {subEntries.length > 1 ? `items` : `item`}
            </Info>
          </ExpandButton>
          {copyable ? <CopyButton value={value} /> : null}
          {expanded ? (
            subEntryPages.length === 1 ? (
              <SubEntries>{subEntries.map(handleEntry)}</SubEntries>
            ) : (
              <SubEntries>
                {subEntryPages.map((entries, index) => (
                  <div key={index}>
                    <Entry>
                      <LabelButton
                        onClick={() =>
                          setExpandedPages((old) =>
                            old.includes(index)
                              ? old.filter((d) => d !== index)
                              : [...old, index],
                          )
                        }
                      >
                        <Expander expanded={expanded} /> [{index * pageSize} ...{' '}
                        {index * pageSize + pageSize - 1}]
                      </LabelButton>
                      {expandedPages.includes(index) ? (
                        <SubEntries>{entries.map(handleEntry)}</SubEntries>
                      ) : null}
                    </Entry>
                  </div>
                ))}
              </SubEntries>
            )
          ) : null}
        </>
      ) : (
        <>
          <Label>{label}:</Label> <Value>{displayValue(value)}</Value>
        </>
      )}
    </Entry>
  )
}

type ExplorerProps = Partial<RendererProps> & {
  renderer?: Renderer
  defaultExpanded?: true | Record<string, boolean>
  copyable?: boolean
}

type Property = {
  defaultExpanded?: boolean | Record<string, boolean>
  label: string
  value: unknown
}

function isIterable(x: any): x is Iterable<unknown> {
  return Symbol.iterator in x
}

export default function Explorer({
  value,
  defaultExpanded,
  renderer = DefaultRenderer,
  pageSize = 100,
  copyable = false,
  ...rest
}: ExplorerProps) {
  const [expanded, setExpanded] = React.useState(Boolean(defaultExpanded))
  const toggleExpanded = React.useCallback(() => setExpanded((old) => !old), [])

  let type: string = typeof value
  let subEntries: Property[] = []

  const makeProperty = (sub: { label: string; value: unknown }): Property => {
    const subDefaultExpanded =
      defaultExpanded === true
        ? { [sub.label]: true }
        : defaultExpanded?.[sub.label]
    return {
      ...sub,
      defaultExpanded: subDefaultExpanded,
    }
  }

  if (Array.isArray(value)) {
    type = 'array'
    subEntries = value.map((d, i) =>
      makeProperty({
        label: i.toString(),
        value: d,
      }),
    )
  } else if (
    value !== null &&
    typeof value === 'object' &&
    isIterable(value) &&
    typeof value[Symbol.iterator] === 'function'
  ) {
    type = 'Iterable'
    subEntries = Array.from(value, (val, i) =>
      makeProperty({
        label: i.toString(),
        value: val,
      }),
    )
  } else if (typeof value === 'object' && value !== null) {
    type = 'object'
    subEntries = Object.entries(value).map(([key, val]) =>
      makeProperty({
        label: key,
        value: val,
      }),
    )
  }

  const subEntryPages = chunkArray(subEntries, pageSize)

  return renderer({
    handleEntry: (entry) => (
      <Explorer
        key={entry.label}
        value={value}
        renderer={renderer}
        copyable={copyable}
        {...rest}
        {...entry}
      />
    ),
    type,
    subEntries,
    subEntryPages,
    value,
    expanded,
    copyable,
    toggleExpanded,
    pageSize,
    ...rest,
  })
}
