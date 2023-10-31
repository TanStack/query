import '@angular/compiler'
import 'zone.js'
import { bootstrapApplication } from '@angular/platform-browser'
import { provideAngularQuery } from '@tanstack/angular-query-experimental'
import { QueryClient } from '@tanstack/angular-query-experimental'
import { SimpleExampleComponent } from './simple-example.component'

bootstrapApplication(SimpleExampleComponent, {
  providers: [provideAngularQuery(new QueryClient())],
})
