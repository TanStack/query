import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { AngularQueryDevtools } from '@tanstack/angular-query-devtools-experimental'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AngularQueryDevtools, RouterOutlet],
  templateUrl: './app.component.html',
  styles: [],
})
export class AppComponent {}
