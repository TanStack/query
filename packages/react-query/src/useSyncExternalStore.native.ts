// Temporary workaround due to an issue with react-native uSES - https://github.com/TanStack/query/pull/3601
// @ts-ignore
import { useSyncExternalStore } from 'use-sync-external-store/shim/index.native.js'

export { useSyncExternalStore }
