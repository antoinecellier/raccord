import React, { Component } from 'react'
import Header from './Header'
import ConfigPanel from './ConfigPanel'
import FalcorPanel from './FalcorPanel'
import GraphQLPanel from './GraphQLPanel'
import ResponsePanel from './ResponsePanel'
import translateGraphQlToFalcor from './translate/graphql-to-falcor'

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

  tryTranslateGraphQL(request) {
    try {
      const falcorRequest = translateGraphQlToFalcor(request)
      this.setState({falcorRequest})
    } catch (e) {
      console.error(e)
    }
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
            <FalcorPanel content={this.state.falcorRequest} onResponse={response => this.handleResponse(response)} />
            <GraphQLPanel onChange={request => this.tryTranslateGraphQL(request)} />
          </div>
          <div className="row">
            <ResponsePanel content={this.state.response} />
          </div>
        </div>
      </div>
    )
  }
}
