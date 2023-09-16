import { afterEach, beforeEach } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'

beforeEach(() => {
  GlobalRegistrator.register()
})

afterEach(() => {
  GlobalRegistrator.unregister()
})
