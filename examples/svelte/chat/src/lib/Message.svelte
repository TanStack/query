<script lang="ts">
  type Props = {
    inProgress?: boolean
    message: { content: string; isQuestion: boolean }
  }

  let { inProgress, message }: Props = $props()
</script>

<div class="flex {message.isQuestion ? 'justify-end' : 'justify-start'}">
  <div
    class="max-w-[80%] rounded-lg p-3 {message.isQuestion
      ? 'bg-blue-500 text-white'
      : 'bg-gray-200 text-gray-800'}"
  >
    {message.content}
    {inProgress ? '...' : null}
  </div>
</div>
