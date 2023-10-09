import '@angular/compiler'
import 'zone.js'
import { bootstrapApplication } from '@angular/platform-browser'
import { provideAngularQuery } from '@tanstack/angular-query'
import { QueryClient } from '@tanstack/angular-query'
import { AppComponent } from './app.component'

bootstrapApplication(AppComponent, {
  providers: [provideAngularQuery(new QueryClient())],
})
