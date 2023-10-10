import {
  CreateMutation,
  CreateQueries,
  CreateQuery,
  UseIsFetching,
  UseQueryClient,
} from '@tanstack/angular-query-experimental'
import axios from 'axios'
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core'
import { JsonPipe } from '@angular/common'
import type {
  CreateMutationOptions,
  CreateQueryOptions,
} from '@tanstack/angular-query-experimental'

type SignalValue<T extends () => unknown> = ReturnType<T>

type UpdatedProduct = {
  title: string
  price: number
}

const createMutationOptions: SignalValue<
  CreateMutationOptions<unknown, Error, UpdatedProduct>
> = {
  mutationFn: (updatedProduct: UpdatedProduct) => {
    return axios.put('https://fakestoreapi.com/products/7', updatedProduct)
  },
  onSuccess: () => {
    console.log('success')
  },
}

const createQueryOptions: SignalValue<CreateQueryOptions> = {
  queryKey: ['test'],
  queryFn: async () => {
    const res = await axios.get('https://fakestoreapi.com/products/1')
    return res.data
  },
  staleTime: 60000,
}

@Component({
  selector: 'has-query',
  standalone: true,
  imports: [JsonPipe],
  template: `
    <!-- <p>isPending: {{ productQuery().isPending }}</p>
    <p>isLoading {{ productQuery().isLoading }}</p>
    <pre>{{ productQuery() | json }}</pre> -->

    <h2>Queries</h2>
    <p>isPending: {{ productQuery().isPending }}</p>
    <p>isLoading {{ productQuery().isLoading }}</p>
    <pre>{{ productQuery() | json }}</pre>

    <pre>Is fetching: {{ isFetching() }}</pre>

    <p>
      Pending mutation: {{ productMutation().isPending }}
      <br />
      <br />
      <br />
      <button (click)="mutateProduct()">Mutate</button>
    </p>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HasQueryComponent {
  createQuery = inject(CreateQuery)
  createMutation = inject(CreateMutation)
  createQueries = inject(CreateQueries)
  useIsFetching = inject(UseIsFetching)
  isFetching = this.useIsFetching({
    queryKey: ['test'],
  })

  public useQueryClient = inject(UseQueryClient)

  queryOptions = signal(createQueryOptions)
  createMutationOptions = signal(createMutationOptions)

  productQuery = this.createQuery(this.queryOptions)

  productMutation = this.createMutation(this.createMutationOptions)

  mutateProduct() {
    this.productMutation().mutate({
      title: 'test',
      price: 100,
    })
  }
}
