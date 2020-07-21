import React from 'react'

import { useConfigContext } from './ReactQueryConfigProvider'

import {
  uid,
  isServer,
  statusError,
  statusSuccess,
  getQueryArgs,
} from '../core/utils'

export function useUid() {
  const ref = React.useRef(null)

  if (ref.current === null) {
    ref.current = uid()
  }

  return ref.current
}

export function useGetLatest(obj) {
  const ref = React.useRef()
  ref.current = obj

  return React.useCallback(() => ref.current, [])
}

export function useQueryArgs(args) {
  const configContext = useConfigContext()

  let [queryKey, config, ...rest] = getQueryArgs(args)

  // Build the final config
  config = {
    ...configContext.shared,
    ...configContext.queries,
    ...config,
  }

  return [queryKey, config, ...rest]
}

export function useMountedCallback(callback) {
  const mounted = React.useRef(false)

  React[isServer ? 'useEffect' : 'useLayoutEffect'](() => {
    mounted.current = true
    return () => (mounted.current = false)
  }, [])

  return React.useCallback(
    (...args) => (mounted.current ? callback(...args) : void 0),
    [callback]
  )
}

export function useRerenderer() {
  const rerender = useMountedCallback(React.useState()[1])
  return React.useCallback(() => rerender({}), [rerender])
}

export function handleSuspense(queryInfo) {
  const { error, query } = queryInfo
  const { config, state } = query

  if (config.suspense || config.useErrorBoundary) {
    if (state.status === statusError && state.throwInErrorBoundary) {
      throw error
    }

    if (config.suspense && state.status !== statusSuccess && config.enabled) {
      query.wasSuspended = true
      throw query.fetch()
    }
  }
}
