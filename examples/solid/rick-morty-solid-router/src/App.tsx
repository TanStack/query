import { Route, Router } from '@solidjs/router'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'
import Character from './Character'
import Characters from './Characters'
import Episode from './Episode'
import Episodes from './Episodes'
import Home from './Home'
import Layout from './Layout'
import './styles.css'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router root={Layout}>
        <Route path="/episodes" component={Episodes} />
        <Route path="/episodes/:episodeId" component={Episode} />
        <Route path="/characters" component={Characters} />
        <Route path="/characters/:characterId" component={Character} />
        <Route path="/" component={Home} />
      </Router>
      <SolidQueryDevtools initialIsOpen />
    </QueryClientProvider>
  )
}
