import { bootstrapApplication } from '@angular/platform-browser'
import { appConfig } from './app/app.config'
import { isDevMode } from '@angular/core'
import { AppComponent } from './app/app.component'

async function prepareApp() {
  if (isDevMode()) {
    const { worker } = await import('./mocks/browser')
    return worker.start({
      quiet: true,
    })
  }

  return Promise.resolve()
}

prepareApp().then(() => {
  bootstrapApplication(AppComponent, appConfig).catch((err) =>
    console.error(err),
  )
})
