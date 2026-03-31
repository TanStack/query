import { mutationSortFns, sortFns } from './utils'
import type { DevtoolsButtonPosition, DevtoolsPosition } from './contexts'

export const firstBreakpoint = 1024
export const secondBreakpoint = 796
export const thirdBreakpoint = 700

export const BUTTON_POSITION: DevtoolsButtonPosition = 'bottom-right'
export const POSITION: DevtoolsPosition = 'bottom'
export const THEME_PREFERENCE = 'system'
export const INITIAL_IS_OPEN = false
export const DEFAULT_HEIGHT = 500
export const PIP_DEFAULT_HEIGHT = 500
export const DEFAULT_WIDTH = 500
export const DEFAULT_SORT_FN_NAME = Object.keys(sortFns)[0]
export const DEFAULT_SORT_ORDER = 1
export const DEFAULT_MUTATION_SORT_FN_NAME = Object.keys(mutationSortFns)[0]
