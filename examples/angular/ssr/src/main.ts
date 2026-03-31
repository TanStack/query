import { bootstrapApplication } from '@angular/platform-browser'
import { getClientAppConfig } from './app/app.config'
import { SsrExampleComponent } from './app/app.component'

bootstrapApplication(SsrExampleComponent, getClientAppConfig()).catch((err) =>
  console.error(err),
)
