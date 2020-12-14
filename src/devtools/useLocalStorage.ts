// @ts-nocheck

import React from 'react'

const getItem = key => {
  try {
    return JSON.parse(localStorage.getItem(key))
  } catch {
    return undefined
  }
}

export default function useLocalStorage(key, defaultValue) {
  const [value, setValue] = React.useState(() => {
    const val = getItem(key)
    if (typeof val === 'undefined' || val === null) {
      return typeof defaultValue === 'function' ? defaultValue() : defaultValue
    }
    return val
  })

  const setter = React.useCallback(
    updater => {
      setValue(old => {
        let newVal = updater

        if (typeof updater == 'function') {
          newVal = updater(old)
        }
        try {
          localStorage.setItem(key, JSON.stringify(newVal))
        } catch {}

        return newVal
      })
    },
    [key]
  )

  return [value, setter]
}
