import React, { Component } from 'react'
import Header from './Header'
import ConfigPanel from './ConfigPanel'
import FalcorPanel from './FalcorPanel'
import GraphQLPanel from './GraphQLPanel'

export default class App extends Component {
  render () {
    return (
      <div>
        <Header />
        <div className="container">
          <div className="row">
            <ConfigPanel />
          </div>
          <div className="row">
            <FalcorPanel />
            <GraphQLPanel />
          </div>
        </div>
      </div>
    )
  }
}
