import { Route, Router } from 'preact-iso'
import Films from './Films'
import Film from './Film'
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
        <a href="/films">
          <span className="uppercase hover:underline">Films</span>
        </a>
        <a href="/characters">
          <span className="uppercase hover:underline">Characters</span>
        </a>
      </nav>
      <div className="p-2">
        <Router>
          <Route path="/films" component={Films} />
          <Route path="/films/:filmId" component={Film} />
          <Route path="/characters" component={Characters} />
          <Route path="/characters/:characterId" component={Character} />
          <Route path="/" component={Home} />
        </Router>
      </div>
    </div>
  )
}
