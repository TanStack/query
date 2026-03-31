import { bootstrapApplication } from '@angular/platform-browser'
import { getClientAppConfig } from './app/app.config'
import { SsrPersistExampleComponent } from './app/app.component'

bootstrapApplication(SsrPersistExampleComponent, getClientAppConfig()).catch(
  (err) => console.error(err),
)
