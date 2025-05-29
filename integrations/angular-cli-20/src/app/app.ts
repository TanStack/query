import { Component } from '@angular/core'
import { injectQuery } from '@tanstack/angular-query-experimental'

@Component({
  selector: 'app-root',
  template: `
    @if (query.isPending()) {
      <div>Loading...</div>
    }
    @if (query.isError()) {
      <div>An error has occurred!</div>
    }
    @if (query.isSuccess()) {
      <div>{{ query.data() }}</div>
    }
  `,
})
export class App {
  query = injectQuery(() => ({
    queryKey: ['test'],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 1000))
      return 'Success'
    },
  }))
}
