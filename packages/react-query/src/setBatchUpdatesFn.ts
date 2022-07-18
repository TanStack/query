import { notifyManager } from '@tanstack/query-core'
import { unstable_batchedUpdates } from './reactBatchedUpdates'

notifyManager.setBatchNotifyFunction(unstable_batchedUpdates)
