export function Message({
  inProgress,
  message,
}: {
  inProgress?: boolean
  message: { content: string; isQuestion: boolean }
}) {
  return (
    <div
      className={`flex ${message.isQuestion ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          message.isQuestion
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-800'
        }`}
      >
        {message.content}
        {inProgress ? '...' : null}
      </div>
    </div>
  )
}
