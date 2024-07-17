import { Button, Link } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { Route, Link as RouterLink, Routes } from 'react-router-dom'
import Episodes from './Episodes'
import Episode from './Episode'
import Characters from './Characters'
import Character from './Character'
import Home from './Home'

export default function Layout() {
  const classes = useStyles()

  return (
    <div className="App">
      <nav className={classes.menu}>
        <Link component={RouterLink} to="/">
          <Button color="primary">Home</Button>
        </Link>
        <Link component={RouterLink} to="/episodes">
          <Button color="primary">Episodes</Button>
        </Link>
        <Link component={RouterLink} to="/characters">
          <Button color="primary">Characters</Button>
        </Link>
      </nav>
      <main className={classes.main}>
        <Routes>
          <Route exact path="/episodes" element={<Episodes />} />
          <Route exact path="/episodes/:episodeId" element={<Episode />} />
          <Route exact path="/characters" element={<Characters />} />
          <Route
            exact
            path="/characters/:characterId"
            element={<Character />}
          />
          <Route path="/" element={<Home />} />
        </Routes>
      </main>
    </div>
  )
}

const useStyles = makeStyles((theme) => ({
  main: {
    margin: '0 auto',
    padding: '16px',
  },
  menu: {
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: '#CCC',
    '& button': {
      margin: theme.spacing(1),
    },
  },
}))
