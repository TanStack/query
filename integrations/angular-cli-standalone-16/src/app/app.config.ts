import { ApplicationConfig } from '@angular/core';
import { provideAngularQuery, QueryClient } from '@tanstack/angular-query-experimental'

export const appConfig: ApplicationConfig = {
  providers: [
    provideAngularQuery(new QueryClient()),
  ],
};
