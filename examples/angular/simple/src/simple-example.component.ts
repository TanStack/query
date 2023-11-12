import { AngularQueryDevtoolsComponent } from '@tanstack/angular-query-devtools-experimental'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { injectQuery } from '@tanstack/angular-query-experimental'
import { HttpClient } from '@angular/common/http'
import { lastValueFrom, tap } from 'rxjs'

type Response = {
  name: string
  description: string
  subscribers_count: number
  stargazers_count: number
  forks_count: number
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'simple-example',
  standalone: true,
  template: `
    <ng-container *ngIf="query().isPending">Loading...</ng-container>
    <ng-container *ngIf="query().error as error">
      An error has occurred: {{ error?.message }}
    </ng-container>
    <div *ngIf="query().data as data">
      <h1>{{ data.name }}</h1>
      <p>{{ data.description }}</p>
      <strong>👀 {{ data.subscribers_count }}</strong>
      <strong>✨ {{ data.stargazers_count }}</strong>
      <strong>🍴 {{ data.forks_count }}</strong>
    </div>

    <angular-query-devtools initialIsOpen />
  `,
  imports: [AngularQueryDevtoolsComponent, CommonModule],
})
export class SimpleExampleComponent {
  http = inject(HttpClient)

  query = injectQuery((client) => ({
    queryKey: ['repoData'],
    queryFn: () =>
      lastValueFrom(
        this.http
          .get<Response>(
            'https://api.github.com/repos/tannerlinsley/react-query',
          )
          .pipe(tap((x) => console.log(x, client))),
      ),
  }))
}
