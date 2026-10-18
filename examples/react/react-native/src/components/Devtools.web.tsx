import * as React from 'react'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export function Devtools() {
  return <ReactQueryDevtools initialIsOpen />
}
