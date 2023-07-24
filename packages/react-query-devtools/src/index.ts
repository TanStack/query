'use client'

import * as devtools from './devtools'

export const ReactQueryDevtools: (typeof devtools)['ReactQueryDevtools'] =
  process.env.NODE_ENV !== 'development'
    ? function () {
        return null
      }
    : devtools.ReactQueryDevtools
