import {
  bootstrapApplication,
  type BootstrapContext,
} from '@angular/platform-browser'
import { getServerConfig } from './app/app.config.server'
import { SsrPersistExampleComponent } from './app/app.component'

const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(
    SsrPersistExampleComponent,
    getServerConfig(context),
    context,
  )

export default bootstrap
