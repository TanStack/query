import { bootstrapApplication } from '@angular/platform-browser'
import { appConfig } from './app/app.config'
import { SsrPersistExampleComponent } from './app/app.component'

bootstrapApplication(SsrPersistExampleComponent, appConfig).catch((err) =>
  console.error(err),
)
