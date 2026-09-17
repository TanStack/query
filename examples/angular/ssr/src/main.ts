import { bootstrapApplication } from '@angular/platform-browser'
import { appConfig } from './app/app.config'
import { SsrExampleComponent } from './app/app.component'

bootstrapApplication(SsrExampleComponent, appConfig).catch((err) =>
  console.error(err),
)
