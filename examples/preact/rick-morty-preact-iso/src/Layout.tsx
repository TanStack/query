import { Route, Router } from 'preact-iso'
import Episodes from './Episodes'
import Episode from './Episode'
import Characters from './Characters'
import Character from './Character'
import Home from './Home'

export default function Layout() {
  return (
    <div>
      <nav className="bg-gray-300 w-full flex flex-row gap-6 justify-center items-center h-12">
        <a href="/">
          <span className="uppercase hover:underline">Home</span>
        </a>
        <a href="/episodes">
          <span className="uppercase hover:underline">Episodes</span>
        </a>
        <a href="/characters">
          <span className="uppercase hover:underline">Characters</span>
        </a>
      </nav>
      <div className="p-2">
        <Router>
          <Route path="/episodes" component={Episodes} />
          <Route path="/episodes/:episodeId" component={Episode} />
          <Route path="/characters" component={Characters} />
          <Route path="/characters/:characterId" component={Character} />
          <Route path="/" component={Home} />
        </Router>
      </div>
    </div>
  )
}
