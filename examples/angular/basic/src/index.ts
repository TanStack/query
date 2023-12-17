import '@angular/compiler'
import 'zone.js'
import { provideHttpClient, withFetch } from '@angular/common/http'
import { bootstrapApplication } from '@angular/platform-browser'
import { provideAngularQuery } from '@tanstack/angular-query-experimental'
import { QueryClient } from '@tanstack/angular-query-experimental'
import { BasicExampleComponent } from './basic-example.component'

bootstrapApplication(BasicExampleComponent, {
  providers: [
    provideHttpClient(withFetch()),
    provideAngularQuery(
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
          },
        },
      }),
    ),
  ],
})
