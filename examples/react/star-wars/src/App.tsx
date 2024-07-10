import { BrowserRouter as Router } from 'react-router-dom'
import { ThemeProvider } from '@mui/material'
import { createTheme } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import Layout from './Layout'

import './styles.css'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ThemeProvider theme={theme}>
          <Layout />
          <ReactQueryDevtools initialIsOpen />
        </ThemeProvider>
      </Router>
    </QueryClientProvider>
  )
}

const theme = createTheme({
  typography: {
    h1: {
      fontFamily: 'Roboto Mono, monospace',
    },
    h2: {
      fontFamily: 'Roboto Mono, monospace',
    },
    h3: {
      fontFamily: 'Roboto Mono, monospace',
    },
    h4: {
      fontFamily: 'Roboto Mono, monospace',
    },
    h5: {
      fontFamily: 'Roboto Mono, monospace',
    },
    h6: {
      fontFamily: 'Roboto Mono, monospace',
    },
  },
})
