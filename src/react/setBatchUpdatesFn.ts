import { setBatchUpdatesFn } from '../core'
import { unstable_batchedUpdates } from './reactBatchedUpdates'

setBatchUpdatesFn(unstable_batchedUpdates)
