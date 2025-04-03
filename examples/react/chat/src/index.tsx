import ReactDOM from 'react-dom/client'
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import './style.css'
import { useState } from 'react'
import { chatQueryOptions } from './chat'
import { Message } from './message'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools />
      <Example />
    </QueryClientProvider>
  )
}

function ChatMessage({ question }: { question: string }) {
  const { error, data = [], isFetching } = useQuery(chatQueryOptions(question))

  if (error) return 'An error has occurred: ' + error.message

  return (
    <div>
      <Message message={{ content: question, isQuestion: true }} />
      <Message
        inProgress={isFetching}
        message={{ content: data.join(' '), isQuestion: false }}
      />
    </div>
  )
}

function Example() {
  const [questions, setQuestions] = useState<Array<string>>([])
  const [currentQuestion, setCurrentQuestion] = useState('')

  const submitMessage = () => {
    setQuestions([...questions, currentQuestion])
    setCurrentQuestion('')
  }

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800">
        TanStack Chat Example
      </h1>
      <div className="overflow-y-auto mb-4 space-y-4">
        {questions.map((question) => (
          <ChatMessage key={question} question={question} />
        ))}
      </div>

      <div className="flex items-center space-x-2">
        <input
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-100"
          value={currentQuestion}
          onChange={(e) => setCurrentQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              submitMessage()
            }
          }}
          placeholder="Type your message..."
        />
        <button
          onClick={submitMessage}
          disabled={!currentQuestion.trim()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-2xl shadow-md transition"
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
      </div>
    </div>
  )
}

const rootElement = document.getElementById('root') as HTMLElement
ReactDOM.createRoot(rootElement).render(<App />)
