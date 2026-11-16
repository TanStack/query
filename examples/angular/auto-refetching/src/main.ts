import { bootstrapApplication } from '@angular/platform-browser'
import { AppComponent } from './app/app.component'
import { appConfig } from './app/app.config'

bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    // an simple endpoint for getting current list
    localStorage.setItem(
      'tasks',
      JSON.stringify(['Item 1', 'Item 2', 'Item 3']),
    )
  })
  .catch((err) => console.error(err))
