import React, { Component } from 'react'
import Header from './Header'
import ConfigPanel from './ConfigPanel'
import FalcorPanel from './FalcorPanel'
import GraphQLPanel from './GraphQLPanel'
import ResponsePanel from './ResponsePanel'

export default class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      response: ''
    }
  }
  handleResponse(response) {
    this.setState({response})
  }

  render () {
    return (
      <div>
        <Header />
        <div className="container">
          <div className="row">
            <ConfigPanel />
          </div>
          <div className="row">
            <FalcorPanel onResponse={response => this.handleResponse(response)} />
            <GraphQLPanel />
          </div>
          <div className="row">
            <ResponsePanel content={this.state.response} />
          </div>
        </div>
      </div>
    )
  }
}
