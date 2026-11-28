export type MountRemote = (container: Element) => () => void

const container = document.querySelector('main')
const bookList = document.querySelector<HTMLButtonElement>('#book-list')
const bookmarks = document.querySelector<HTMLButtonElement>('#bookmarks')
if (!container || !bookList || !bookmarks)
  throw new Error('Missing book list shell')

let unmount: ReturnType<MountRemote> | undefined

async function openRoute(button: HTMLButtonElement, main: HTMLElement) {
  const entry = button.dataset.entry
  if (!entry) throw new Error('Missing remote entry for ' + button.id)
  const url = new URL(entry, document.baseURI)
  const remote: { mount: MountRemote } = await import(
    /* @vite-ignore */ url.href
  )
  unmount?.()
  unmount = remote.mount(main)
}

bookList.onclick = () => openRoute(bookList, container)
bookmarks.onclick = () => openRoute(bookmarks, container)
await openRoute(bookList, container)
