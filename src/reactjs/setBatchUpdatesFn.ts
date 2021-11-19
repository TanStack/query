import { notifyManager } from '../core'
import { unstable_batchedUpdates } from './reactBatchedUpdates'

notifyManager.setBatchNotifyFunction(unstable_batchedUpdates)
