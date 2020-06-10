import React from 'react'
import { Route, Switch } from 'react-router-dom'
import routes from './routes'

import './App.css'

const App = () => (
  <div className="App-container">
    <div>
      <div className="App-header">
        <h2>React Query Server Side Rendering Example</h2>
      </div>
      <div className="App-content">
        <Switch>
          {routes.map((routeConfig, index) => (
            <Route key={index} {...routeConfig} />
          ))}
        </Switch>
      </div>
    </div>
  </div>
)

export default App
