<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import Message from './Message.svelte'
  import { messagesQueries } from './services/messages/queries'

  type Props = {
    id: string
    question: string
  }

  let { id, question }: Props = $props()

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
