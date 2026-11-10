# @tanstack/angular-query-persist-client

Persistence integration for `@tanstack/angular-query`.

## Installation

```sh
pnpm add @tanstack/angular-query-persist-client @tanstack/query-async-storage-persister
```

`@tanstack/query-async-storage-persister` provides the persister used below. Any
other persister works as well.

## Usage

```ts
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query'
import { withPersistQueryClient } from '@tanstack/angular-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import type { ApplicationConfig } from '@angular/core'

export const appConfig: ApplicationConfig = {
  providers: [
    provideTanStackQuery(
      () => new QueryClient(),
      withPersistQueryClient(() => ({
        persistOptions: {
          persister: createAsyncStoragePersister({ storage: localStorage }),
        },
      })),
    ),
  ],
}
```

The factory runs only in the browser and inside an Angular injection context.
This makes it safe to access browser-only storage and inject application
services without sharing persistence state between SSR requests.
