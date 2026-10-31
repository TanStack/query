import { A } from '@solidjs/router'
import type { RouteSectionProps } from '@solidjs/router'

export default function Layout(props: RouteSectionProps) {
  return (
    <div>
      <nav class="bg-gray-300 w-full flex flex-row gap-6 justify-center items-center h-12">
        <A href="/">
          <span class="uppercase hover:underline">Home</span>
        </A>
        <A href="/films">
          <span class="uppercase hover:underline">Films</span>
        </A>
        <A href="/characters">
          <span class="uppercase hover:underline">Characters</span>
        </A>
      </nav>
      <div class="p-2">{props.children}</div>
    </div>
  )
}
