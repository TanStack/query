import React from 'react'

//

export const statusIdle = 'idle'
export const statusLoading = 'loading'
export const statusError = 'error'
export const statusSuccess = 'success'

let _uid = 0
export const uid = () => _uid++
export const cancelledError = {}
export let globalStateListeners = []
export const isServer = typeof window === 'undefined'
export const noop = () => {}
export let Console = console || { error: noop, warn: noop, log: noop }

export function useUid() {
  const ref = React.useRef(uid())
  return ref.current
}

export function setConsole(c) {
  Console = c
}

export function useGetLatest(obj) {
  const ref = React.useRef()
  ref.current = obj

  return React.useCallback(() => ref.current, [])
}

export function functionalUpdate(updater, old) {
  return typeof updater === 'function' ? updater(old) : updater
}

export function stableStringifyReplacer(_, value) {
  return isObject(value)
    ? Object.assign(
        {},
        ...Object.keys(value)
          .sort()
          .map(key => ({
            [key]: value[key],
          }))
      )
    : Array.isArray(value)
    ? value
    : String(value)
}

export function stableStringify(obj) {
  return JSON.stringify(obj, stableStringifyReplacer)
}

export function isObject(a) {
  return a && typeof a === 'object' && !Array.isArray(a)
}

export function isDocumentVisible() {
  return (
    typeof document === 'undefined' ||
    document.visibilityState === undefined ||
    document.visibilityState === 'visible' ||
    document.visibilityState === 'prerender'
  )
}

export function isOnline() {
  return navigator.onLine === undefined || navigator.onLine
}
