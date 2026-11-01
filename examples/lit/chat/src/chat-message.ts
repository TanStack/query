import { LitElement, html } from 'lit'
import { createQueryController } from '@tanstack/lit-query'
import { messagesQueries } from './services/messages/queries'
import './message-bubble'

class ChatMessage extends LitElement {
  static properties = {
    messageId: { attribute: false },
    question: { attribute: false },
  }

  messageId = ''
  question = ''

  private readonly message = createQueryController(this, () =>
    messagesQueries.detail(this.messageId, this.question),
  )

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    const { error, data, isFetching } = this.message()

    if (error) return html`An error has occurred: ${error.message}`

    return html`
      <div>
        <message-bubble
          .message=${{ content: this.question, isQuestion: true }}
        ></message-bubble>
        <message-bubble
          .inProgress=${isFetching}
          .message=${{ content: (data ?? []).join(' '), isQuestion: false }}
        ></message-bubble>
      </div>
    `
  }
}

customElements.define('chat-message', ChatMessage)
