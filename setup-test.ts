// @ts-expect-error we don't want to add bun-types to our global tsconfig
import { afterEach, beforeEach } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'

beforeEach(() => {
  GlobalRegistrator.register()
})

afterEach(() => {
  GlobalRegistrator.unregister()
})
