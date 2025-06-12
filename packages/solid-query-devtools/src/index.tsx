import { isDev } from 'solid-js/web'
import clientOnly from './clientOnly'
import type SolidQueryDevtoolsComp from './devtools'

export const SolidQueryDevtools: typeof SolidQueryDevtoolsComp = isDev
  ? clientOnly(() => import('./devtools'))
  : function () {
      return null
    }
