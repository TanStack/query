export type MountRemote = (container: Element) => () => void

const container = document.querySelector('main')
const catalog = document.querySelector<HTMLButtonElement>('#catalog')
const bookmarks = document.querySelector<HTMLButtonElement>('#bookmarks')
if (!container || !catalog || !bookmarks)
  throw new Error('Missing reading list shell')

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

catalog.onclick = () => openRoute(catalog, container)
bookmarks.onclick = () => openRoute(bookmarks, container)
await openRoute(catalog, container)
