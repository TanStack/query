/* @refresh reload */
import { For, Show, createSignal } from 'solid-js'
import { render } from 'solid-js/web'
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/solid-query'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'

import './style.css'
import { messagesQueries } from './services/messages/queries'
import { Message } from './message'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SolidQueryDevtools />
      <Example />
    </QueryClientProvider>
  )
}

function ChatMessage(props: { id: string; question: string }) {
  const query = useQuery(() => messagesQueries.detail(props.id, props.question))

  return (
    <Show
      when={!query.error}
      fallback={`An error has occurred: ${query.error?.message}`}
    >
      <div>
        <Message message={{ content: props.question, isQuestion: true }} />
        <Message
          inProgress={query.isFetching}
          message={{ content: (query.data ?? []).join(' '), isQuestion: false }}
        />
      </div>
    </Show>
  )
}

function Example() {
  const [questions, setQuestions] = createSignal<
    Array<{ id: string; question: string }>
  >([])
  const [currentQuestion, setCurrentQuestion] = createSignal('')

  const submitMessage = () => {
    setQuestions([
      ...questions(),
      { id: crypto.randomUUID(), question: currentQuestion() },
    ])
    setCurrentQuestion('')
  }

  return (
    <div class="flex flex-col h-screen max-w-3xl mx-auto p-4">
      <h1 class="text-3xl font-bold text-gray-800">TanStack Chat Example</h1>
      <div class="overflow-y-auto mb-4 space-y-4">
        <For each={questions()}>
          {(item) => <ChatMessage id={item.id} question={item.question} />}
        </For>
      </div>

      <form
        class="flex items-center space-x-2"
        onSubmit={(e) => {
          e.preventDefault()
          submitMessage()
        }}
      >
        <input
          class="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-100"
          value={currentQuestion()}
          onInput={(e) => setCurrentQuestion(e.currentTarget.value)}
          placeholder="Type your message..."
        />
        <button
          type="submit"
          disabled={!currentQuestion().trim()}
          class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-2xl shadow-md transition"
        >
          <span>Send</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
            <path d="m21.854 2.147-10.94 10.939" />
          </svg>
        </button>
      </form>
    </div>
  )
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')
render(() => <App />, rootElement)
