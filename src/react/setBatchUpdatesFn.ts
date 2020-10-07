import { setBatchNotifyFn } from '../core'
import { unstable_batchedUpdates } from './reactBatchedUpdates'

setBatchNotifyFn(unstable_batchedUpdates)
