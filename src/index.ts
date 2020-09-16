import { setBatchedUpdates } from './core/index'
import { unstable_batchedUpdates } from './react/reactBatchedUpdates'
setBatchedUpdates(unstable_batchedUpdates)

export * from './core/index'
export * from './react/index'
