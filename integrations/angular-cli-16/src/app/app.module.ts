import { NgIf } from '@angular/common'
import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { AngularQueryDevtools } from '@tanstack/angular-query-devtools-experimental'
import {
  QueryClient,
  provideAngularQuery,
} from '@tanstack/angular-query-experimental'

import { AppComponent } from './app.component'

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, AngularQueryDevtools, NgIf],
  providers: [provideAngularQuery(new QueryClient())],
  bootstrap: [AppComponent],
})
export class AppModule {}
