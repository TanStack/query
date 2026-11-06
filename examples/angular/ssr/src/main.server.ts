import {
  bootstrapApplication,
  type BootstrapContext,
} from '@angular/platform-browser'
import { serverConfig } from './app/app.config.server'
import { SsrExampleComponent } from './app/app.component'

const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(SsrExampleComponent, serverConfig, context)

export default bootstrap
