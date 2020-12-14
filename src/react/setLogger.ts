import { setLogger } from '../core'
import { logger } from './logger'

if (logger) {
  setLogger(logger)
}
