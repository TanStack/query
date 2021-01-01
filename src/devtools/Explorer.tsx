// @ts-nocheck

import React from 'react'

import { styled } from './utils'

export const Entry = styled('div', {
  fontFamily: 'Menlo, monospace',
  fontSize: '0.9rem',
  lineHeight: '1.7',
  outline: 'none',
  wordBreak: 'break-word',
})

export const Label = styled('span', {
  cursor: 'pointer',
  color: 'white',
})

export const Value = styled('span', (props, theme) => ({
  color: theme.danger,
}))

export const SubEntries = styled('div', {
  marginLeft: '.1rem',
  paddingLeft: '1rem',
  borderLeft: '2px solid rgba(0,0,0,.15)',
})

export const Info = styled('span', {
  color: 'grey',
  fontSize: '.7rem',
})

export const Expander = ({ expanded, style = {}, ...rest }) => (
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

const DefaultRenderer = ({
  handleEntry,
  label,
  value,
  // path,
  subEntries,
  subEntryPages,
  type,
  // depth,
  expanded,
  toggle,
  pageSize,
}) => {
  const [expandedPages, setExpandedPages] = React.useState([])

  return (
    <Entry key={label}>
      {subEntryPages?.length ? (
        <>
          <Label onClick={() => toggle()}>
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

export default function Explorer({
  value,
  defaultExpanded,
  renderer = DefaultRenderer,
  pageSize = 100,
  depth = 0,
  ...rest
}) {
  const [expanded, setExpanded] = React.useState(defaultExpanded)

  const toggle = set => {
    setExpanded(old => (typeof set !== 'undefined' ? set : !old))
  }

  const path = []

  let type = typeof value
  let subEntries
  const subEntryPages = []

  const makeProperty = sub => {
    const newPath = path.concat(sub.label)
    const subDefaultExpanded =
      defaultExpanded === true
        ? { [sub.label]: true }
        : defaultExpanded?.[sub.label]
    return {
      ...sub,
      path: newPath,
      depth: depth + 1,
      defaultExpanded: subDefaultExpanded,
    }
  }

  if (Array.isArray(value)) {
    type = 'array'
    subEntries = value.map((d, i) =>
      makeProperty({
        label: i,
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
        label: i,
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

  if (subEntries) {
    let i = 0

    while (i < subEntries.length) {
      subEntryPages.push(subEntries.slice(i, i + pageSize))
      i = i + pageSize
    }
  }

  return renderer({
    handleEntry: entry => (
      <Explorer key={entry.label} renderer={renderer} {...rest} {...entry} />
    ),
    type,
    subEntries,
    subEntryPages,
    depth,
    value,
    path,
    expanded,
    toggle,
    pageSize,
    ...rest,
  })
}
