import { LitElement, html } from 'lit'

class MessageBubble extends LitElement {
  static properties = {
    inProgress: { attribute: false },
    message: { attribute: false },
  }

  inProgress = false
  message = { content: '', isQuestion: false }

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    return html`
      <div
        class="flex ${
          this.message.isQuestion ? 'justify-end' : 'justify-start'
        }"
      >
        <div
          class="max-w-[80%] rounded-lg p-3 ${
            this.message.isQuestion
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-800'
          }"
        >
          ${this.message.content} ${this.inProgress ? '...' : null}
        </div>
      </div>
    `
  }
}

customElements.define('message-bubble', MessageBubble)
