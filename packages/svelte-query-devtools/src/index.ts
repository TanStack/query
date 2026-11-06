import { DEV } from 'esm-env'
import Devtools from './SvelteQueryDevtools.svelte'

export const SvelteQueryDevtools: typeof Devtools = DEV
  ? Devtools
  : function () {
      return {}
    }
