import React from 'react'

import { styled } from './utils'

export const Entry = styled('div', {
  fontFamily: 'Menlo, monospace',
  fontSize: '1em',
  lineHeight: '1.7',
  outline: 'none',
  wordBreak: 'break-word',
})

export const Label = styled('span', {
  cursor: 'pointer',
  color: 'white',
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
  handleEntry?: (entry: Entry) => JSX.Element
  label?: string
  value?: any
  subEntries?: Entry[]
  subEntryPages?: Entry[][]
  type?: string
  expanded?: boolean
  toggleExpanded: () => void
  pageSize: number
}

type Renderer = (props: RendererProps) => JSX.Element

const DefaultRenderer: Renderer = ({
  handleEntry = () => null,
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
      {subEntryPages?.length ? (
        <>
          <Label onClick={() => toggleExpanded()}>
            <Expander expanded={expanded} /> {label}{' '}
            <Info>
              {String(type).toLowerCase() === 'iterable' ? '(Iterable) ' : ''}
              {subEntries.length} {subEntries.length > 1 ? `items` : `item`}
            </Info>
          </Label>
          {expanded ? (
            subEntryPages.length === 1 ? (
              <SubEntries>
                {subEntries.map(entry => handleEntry(entry))}
              </SubEntries>
            ) : (
              <SubEntries>
                {subEntryPages.map((entries, index) => (
                  <div key={index}>
                    <Entry>
                      <Label
                        onClick={() =>
                          setExpandedPages(old =>
                            old.includes(index)
                              ? old.filter(d => d !== index)
                              : [...old, index]
                          )
                        }
                      >
                        <Expander expanded={expanded} /> [{index * pageSize} ...{' '}
                        {index * pageSize + pageSize - 1}]
                      </Label>
                      {expandedPages.includes(index) ? (
                        <SubEntries>
                          {entries.map(entry => handleEntry(entry))}
                        </SubEntries>
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
          <Label>{label}:</Label>{' '}
          <Value>
            {JSON.stringify(value, Object.getOwnPropertyNames(Object(value)))}
          </Value>
        </>
      )}
    </Entry>
  )
}

type ExplorerProps = Partial<RendererProps> & {
  renderer?: Renderer
  defaultExpanded?: true | Record<string, boolean>
}

export default function Explorer({
  value,
  defaultExpanded,
  renderer = DefaultRenderer,
  pageSize = 100,
  ...rest
}: ExplorerProps) {
  const [expanded, setExpanded] = React.useState(Boolean(defaultExpanded))
  const toggleExpanded = React.useCallback(() => setExpanded(old => !old), [])

  let type: string = typeof value
  let subEntries

  const makeProperty = (sub: { label: string; value: unknown }) => {
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
      })
    )
  } else if (
    value !== null &&
    typeof value === 'object' &&
    typeof value[Symbol.iterator] === 'function'
  ) {
    type = 'Iterable'
    subEntries = Array.from(value, (val, i) =>
      makeProperty({
        label: i.toString(),
        value: val,
      })
    )
  } else if (typeof value === 'object' && value !== null) {
    type = 'object'
    // eslint-disable-next-line no-shadow
    subEntries = Object.entries(value).map(([label, value]) =>
      makeProperty({
        label,
        value,
      })
    )
  }

  const subEntryPages = []
  if (subEntries) {
    let i = 0

    while (i < subEntries.length) {
      subEntryPages.push(subEntries.slice(i, i + pageSize))
      i = i + pageSize
    }
  }

  return renderer({
    handleEntry: entry => (
      <Explorer value={value} renderer={renderer} {...rest} {...entry} />
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
