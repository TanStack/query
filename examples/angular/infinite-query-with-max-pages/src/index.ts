import '@angular/compiler'
import 'zone.js'
import { provideHttpClient, withFetch } from '@angular/common/http'
import { bootstrapApplication } from '@angular/platform-browser'
import { provideAngularQuery } from '@tanstack/angular-query-experimental'
import { QueryClient } from '@tanstack/angular-query-experimental'
import { Example } from './example.component'

bootstrapApplication(Example, {
  providers: [
    provideAngularQuery(new QueryClient()),
    provideHttpClient(withFetch()),
  ],
})
