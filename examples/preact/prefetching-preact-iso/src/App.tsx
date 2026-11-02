import { LocationProvider, Route, Router } from 'preact-iso'
import Character from './Character'
import Home from './Home'

export default function App() {
  return (
    <LocationProvider>
      <Router>
        <Route path="/" component={Home} />
        <Route path="/character/:id" component={Character} />
      </Router>
    </LocationProvider>
  )
}
