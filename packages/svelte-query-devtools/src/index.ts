import { DEV } from 'esm-env'
import Devtools from './SvelteQueryDevtools.svelte'
import type { Component, ComponentProps } from 'svelte'

export const SvelteQueryDevtools: Component<ComponentProps<typeof Devtools>> =
  DEV
    ? Devtools
    : function () {
        return {}
      }
