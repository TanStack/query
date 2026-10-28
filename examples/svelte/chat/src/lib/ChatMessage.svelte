<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { messagesQueries } from './services/messages/queries'
  import Message from './Message.svelte'

  let { id, question }: { id: string; question: string } = $props()

  const query = createQuery(() => messagesQueries.detail(id, question))
</script>

{#if query.error}
  An error has occurred: {query.error.message}
{:else}
  <div>
    <Message message={{ content: question, isQuestion: true }} />
    <Message
      inProgress={query.isFetching}
      message={{ content: (query.data ?? []).join(' '), isQuestion: false }}
    />
  </div>
{/if}
