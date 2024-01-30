import '@angular/compiler'
import 'zone.js'
import { bootstrapApplication } from '@angular/platform-browser'
import {
  QueryClient,
  provideAngularQuery,
} from '@tanstack/angular-query-experimental'
import { provideHttpClient, withFetch } from '@angular/common/http'
import { SimpleExampleComponent } from './simple-example.component'

bootstrapApplication(SimpleExampleComponent, {
  providers: [
    provideHttpClient(withFetch()),
    provideAngularQuery(new QueryClient()),
  ],
})
