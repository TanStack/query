import { ChangeDetectionStrategy, Component, signal } from '@angular/core'
import { injectQueries } from '@tanstack/angular-query'

type Item = {
  id: number
  name: string
}

type ItemDetails = {
  description: string
  updatedAt: string
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  template: `
    <main>
      <h1>Dynamic queries</h1>
      <p>
        Each item below owns one entry in <code>injectQueries</code>. Add or
        remove items to change the query list.
      </p>

      <button type="button" (click)="addItem()">Add item</button>

      @if (items().length === 0) {
        <p>No items. Add one to start a query.</p>
      } @else {
        <ul>
          @for (item of items(); track item.id; let index = $index) {
            <li>
              <div>
                <strong>{{ item.name }}</strong>
                @if (queries()[index].isPending()) {
                  <span> Loading...</span>
                } @else if (queries()[index].isError()) {
                  <span> Could not load this item.</span>
                } @else {
                  <span> {{ queries()[index].data()?.description }}</span>
                }
              </div>
              <button type="button" (click)="removeItem(item.id)">
                Remove
              </button>
            </li>
          }
        </ul>
      }
    </main>
  `,
  styles: `
    main {
      font:
        16px/1.5 system-ui,
        sans-serif;
      margin: 3rem auto;
      max-width: 42rem;
      padding: 0 1rem;
    }

    button {
      cursor: pointer;
      margin: 0.25rem;
      padding: 0.45rem 0.7rem;
    }

    li {
      align-items: center;
      display: flex;
      justify-content: space-between;
      margin: 0.75rem 0;
    }
  `,
})
export class AppComponent {
  readonly items = signal<Array<Item>>([
    { id: 1, name: 'First item' },
    { id: 2, name: 'Second item' },
  ])

  readonly queries = injectQueries(() => ({
    queries: this.items().map((item) => ({
      queryKey: ['item-details', item.id],
      queryFn: () => this.loadItemDetails(item),
    })),
  }))

  #nextId = 3

  addItem(): void {
    const id = this.#nextId++
    this.items.update((items) => [...items, { id, name: `Item ${id}` }])
  }

  removeItem(id: number): void {
    this.items.update((items) => items.filter((item) => item.id !== id))
  }

  private async loadItemDetails(item: Item): Promise<ItemDetails> {
    await new Promise((resolve) => setTimeout(resolve, 350))
    return {
      description: `${item.name} was loaded by its own query.`,
      updatedAt: new Date().toLocaleTimeString(),
    }
  }
}
