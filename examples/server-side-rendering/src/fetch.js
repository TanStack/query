export default async function(...args) {
  await new Promise(resolve => setTimeout(resolve, 500))
  const res = await fetch(...args)
  return await res.json()
}
