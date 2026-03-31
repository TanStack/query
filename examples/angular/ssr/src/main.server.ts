import {
  bootstrapApplication,
  type BootstrapContext,
} from '@angular/platform-browser'
import { getServerConfig } from './app/app.config.server'
import { SsrExampleComponent } from './app/app.component'

const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(SsrExampleComponent, getServerConfig(context), context)

export default bootstrap
