import type { Readable } from 'svelte/store'
import type { StoreOrVal } from './types.js'
export declare function isSvelteStore<T extends object>(
  obj: StoreOrVal<T>,
): obj is Readable<T>
export declare function noop(): void
//# sourceMappingURL=utils.d.ts.map
