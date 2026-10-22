import { Route, Link as RouterLink, Routes } from 'react-router-dom'
import Episodes from './Episodes'
import Episode from './Episode'
import Characters from './Characters'
import Character from './Character'
import Home from './Home'

export default function Layout() {
  return (
    <div>
      <nav className="bg-gray-300 w-full flex flex-row gap-6 justify-center items-center h-12">
        <RouterLink to="/">
          <span className="uppercase hover:underline">Home</span>
        </RouterLink>
        <RouterLink to="/episodes">
          <span className="uppercase hover:underline">Episodes</span>
        </RouterLink>
        <RouterLink to="/characters">
          <span className="uppercase hover:underline">Characters</span>
        </RouterLink>
      </nav>
      <div className="p-2">
        <Routes>
          <Route path="/episodes" element={<Episodes />} />
          <Route path="/episodes/:episodeId" element={<Episode />} />
          <Route path="/characters" element={<Characters />} />
          <Route path="/characters/:characterId" element={<Character />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </div>
  )
}
