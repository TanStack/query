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
  const [value, setValue] = React.useState()

  React.useEffect(() => {
    const initialValue = getItem(key)

    if (typeof initialValue === 'undefined' || initialValue === null) {
      setValue(
        typeof defaultValue === 'function' ? defaultValue() : defaultValue
      )
    } else {
      setValue(initialValue)
    }
  }, [defaultValue, key])

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
