import { mergeApplicationConfig } from '@angular/core'
import { provideServerRendering, withRoutes } from '@angular/ssr'
import { appConfig } from './app.config'
import { serverRoutes } from './app.routes.server'

export const serverConfig = mergeApplicationConfig(appConfig, {
  providers: [provideServerRendering(withRoutes(serverRoutes))],
})
