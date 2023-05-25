'use client'
import * as React from 'react'

/**
 * none is a special value used to detect an uninitialized ref
 */
const none = {}

/**
 * Like React.useRef but with a lazy initial value, like in React.useState
 */
export function useLazyRef<Value>(
  initializer: () => Value,
): React.MutableRefObject<Value> {
  // not initialized yet
  const ref = React.useRef<Value | typeof none>(none)

  // if it's not initialized (1st render)
  if (ref.current === none) {
    // we initialize it
    ref.current = initializer()
  }
  // now we return the initialized ref
  // "as" is used to not leak any info about type of "none" outside of useLazyRef
  return ref as React.MutableRefObject<Value>
}
