import { Route, Link as RouterLink, Routes } from 'react-router-dom'
import Films from './Films'
import Film from './Film'
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
        <RouterLink to="/films">
          <span className="uppercase hover:underline">Films</span>
        </RouterLink>
        <RouterLink to="/characters">
          <span className="uppercase hover:underline">Characters</span>
        </RouterLink>
      </nav>
      <div className="p-2">
        <Routes>
          <Route exact path="/films" element={<Films />} />
          <Route exact path="/films/:filmId" element={<Film />} />
          <Route exact path="/characters" element={<Characters />} />
          <Route
            exact
            path="/characters/:characterId"
            element={<Character />}
          />
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </div>
  )
}
