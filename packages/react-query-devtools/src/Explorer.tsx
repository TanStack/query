import * as React from 'react'

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
        {...rest}
        {...entry}
      />
    ),
    type,
    subEntries,
    subEntryPages,
    value,
    expanded,
    toggleExpanded,
    pageSize,
    ...rest,
  })
}
