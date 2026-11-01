import { Route, Router } from '@solidjs/router'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'
import Layout from './Layout'
import Films from './Films'
import Film from './Film'
import Characters from './Characters'
import Character from './Character'
import Home from './Home'

import './styles.css'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router root={Layout}>
        <Route path="/films" component={Films} />
        <Route path="/films/:filmId" component={Film} />
        <Route path="/characters" component={Characters} />
        <Route path="/characters/:characterId" component={Character} />
        <Route path="/" component={Home} />
      </Router>
      <SolidQueryDevtools initialIsOpen />
    </QueryClientProvider>
  )
}
