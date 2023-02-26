import { notifyManager } from '@tanstack/query-core'
import { batch } from 'solid-js'

notifyManager.setBatchNotifyFunction(batch)
