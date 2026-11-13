import { bootstrapApplication } from '@angular/platform-browser'
import { serverConfig } from './app/app.config.server'
import { AppComponent } from './app/app.component'
import type { BootstrapContext } from '@angular/platform-browser'

const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(AppComponent, serverConfig, context)

export default bootstrap
