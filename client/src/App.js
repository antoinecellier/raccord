import React, { Component } from 'react'
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
        <div style={{display: 'flex', flexDirection: 'row', height: '70em'}}>
          <FalcorPanel content={this.state.falcorRequest} onResponse={response => this.handleResponse(response)} />
          <GraphQLPanel onChange={request => this.tryTranslateGraphQL(request)} onResponse={response => this.handleResponse(response)} />
          <ResponsePanel content={this.state.response} />
        </div>
      </div>
    )
  }
}
