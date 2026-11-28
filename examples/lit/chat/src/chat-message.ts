import { createQueryController, isFetching } from '@tanstack/lit-query'
import { LitElement, html } from 'lit'
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
    const queryResult = this.message()

    if (queryResult.error)
      return html`An error has occurred: ${queryResult.error.message}`

    return html`
      <div>
        <message-bubble
          .message=${{ content: this.question, isQuestion: true }}
        ></message-bubble>
        <message-bubble
          .inProgress=${isFetching(queryResult)}
          .message=${{ content: (queryResult.data ?? []).join(' '), isQuestion: false }}
        ></message-bubble>
      </div>
    `
  }
}

customElements.define('chat-message', ChatMessage)
