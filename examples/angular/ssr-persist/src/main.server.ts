import { bootstrapApplication } from '@angular/platform-browser'
import { AppComponent } from './app/app.component'
import { serverConfig } from './app/app.config.server'
import type { BootstrapContext } from '@angular/platform-browser'

const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(AppComponent, serverConfig, context)

export default bootstrap
