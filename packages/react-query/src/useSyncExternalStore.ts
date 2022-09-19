// Temporary workaround due to an issue with react-native uSES - https://github.com/TanStack/query/pull/3601
import { useSyncExternalStore as uSES } from 'use-sync-external-store/shim/index.js'

export const useSyncExternalStore = uSES
