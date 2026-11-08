import { bootstrapApplication } from '@angular/platform-browser'
import { BasicExampleComponent } from './app/app.component'
import { appConfig } from './app/app.config'

bootstrapApplication(BasicExampleComponent, appConfig).catch((err) =>
  console.error(err),
)
