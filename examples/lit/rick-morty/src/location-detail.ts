import { LitElement, html } from 'lit'
import { createQueryController } from '@tanstack/lit-query'
import { locationsQueries } from './services/locations/queries'

class LocationDetail extends LitElement {
  static properties = {
    locationId: { attribute: false },
  }

  locationId = ''

  private readonly location = createQueryController(this, () =>
    locationsQueries.detail(this.locationId),
  )

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    const { data, status } = this.location()

    if (status === 'pending') return html`<span>Loading...</span>`
    if (status === 'error') return html`<span>Error :(</span>`

    return html`<span>${data.name} - ${data.type}</span>`
  }
}

customElements.define('location-detail', LocationDetail)
