export function Message(props: {
  inProgress?: boolean
  message: { content: string; isQuestion: boolean }
}) {
  return (
    <div
      class={`flex ${props.message.isQuestion ? 'justify-end' : 'justify-start'}`}
    >
      <div
        class={`max-w-[80%] rounded-lg p-3 ${
          props.message.isQuestion
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-800'
        }`}
      >
        {props.message.content}
        {props.inProgress ? '...' : null}
      </div>
    </div>
  )
}
