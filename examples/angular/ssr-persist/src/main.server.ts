import {
  bootstrapApplication,
  type BootstrapContext,
} from '@angular/platform-browser'
import { serverConfig } from './app/app.config.server'
import { SsrPersistExampleComponent } from './app/app.component'

const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(SsrPersistExampleComponent, serverConfig, context)

export default bootstrap
