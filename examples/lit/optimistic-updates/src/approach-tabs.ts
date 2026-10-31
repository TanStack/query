import { LitElement, html } from 'lit'
import './todo-list-cache'
import './todo-list-ui'

type Tab = 'ui-variables' | 'cache'

class ApproachTabs extends LitElement {
  static properties = {
    activeTab: { state: true },
  }

  private activeTab: Tab = 'ui-variables'

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  private tabStyle(tab: Tab) {
    const isActive = this.activeTab === tab

    return `padding: 0.5rem 1rem; border: none; border-bottom: ${
      isActive ? '2px solid #0070f3' : '2px solid transparent'
    }; background: none; cursor: pointer; font-weight: ${
      isActive ? 600 : 400
    }; color: ${isActive ? '#0070f3' : '#555'}`
  }

  render() {
    return html`
      <div>
        <div
          style="display: flex; border-bottom: 1px solid #ddd; margin-bottom: 1.5rem"
        >
          <button
            type="button"
            style=${this.tabStyle('ui-variables')}
            @click=${() => (this.activeTab = 'ui-variables')}
          >
            Via UI Variables
          </button>
          <button
            type="button"
            style=${this.tabStyle('cache')}
            @click=${() => (this.activeTab = 'cache')}
          >
            Via Cache Manipulation
          </button>
        </div>

        ${
          this.activeTab === 'ui-variables'
            ? html`<todo-list-ui></todo-list-ui>`
            : html`<todo-list-cache></todo-list-cache>`
        }
      </div>
    `
  }
}

customElements.define('approach-tabs', ApproachTabs)
