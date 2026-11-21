<script lang="ts">
  import ChatMessage from './ChatMessage.svelte'

  let questions = $state<Array<{ id: string; question: string }>>([])
  let currentQuestion = $state('')

  const submitMessage = () => {
    questions = [
      ...questions,
      { id: crypto.randomUUID(), question: currentQuestion },
    ]
    currentQuestion = ''
  }
</script>

<div class="flex flex-col h-screen max-w-3xl mx-auto p-4">
  <h1 class="text-3xl font-bold text-gray-800">TanStack Chat Example</h1>
  <div class="overflow-y-auto mb-4 space-y-4">
    {#each questions as { id, question } (id)}
      <ChatMessage {id} {question} />
    {/each}
  </div>

  <form
    class="flex items-center space-x-2"
    onsubmit={(e) => {
      e.preventDefault()
      submitMessage()
    }}
  >
    <input
      class="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-100"
      bind:value={currentQuestion}
      placeholder="Type your message..."
    />
    <button
      type="submit"
      disabled={!currentQuestion.trim()}
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
        <path
          d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"
        />
        <path d="m21.854 2.147-10.94 10.939" />
      </svg>
    </button>
  </form>
</div>
