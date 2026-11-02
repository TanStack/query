export default defineEventHandler(async () => {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return todos
})
