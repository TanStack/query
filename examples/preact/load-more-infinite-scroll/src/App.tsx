import { LocationProvider, Route, Router } from 'preact-iso'
import About from './About'
import Example from './Example'

export default function App() {
  return (
    <LocationProvider>
      <Router>
        <Route path="/" component={Example} />
        <Route path="/about" component={About} />
      </Router>
    </LocationProvider>
  )
}
