import '@angular/compiler'
import 'zone.js'
import { bootstrapApplication } from '@angular/platform-browser'
import { provideAngularQuery } from '@tanstack/angular-query-experimental'
import { QueryClient } from '@tanstack/angular-query-experimental'
import { AppComponent } from './app.component'

bootstrapApplication(AppComponent, {
  providers: [provideAngularQuery(new QueryClient())],
})
