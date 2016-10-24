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
        <div style={{display: 'flex', flexDirection: 'column', height: '800px'}}>
          <div style={{display: 'flex', flexDirection: 'row', flex: 1}}>
            <div style={{flex: 1}}>
              <FalcorPanel content={this.state.falcorRequest} onResponse={response => this.handleResponse(response)} />
            </div>
            <div style={{flex: 1}}>
              <GraphQLPanel onChange={request => this.tryTranslateGraphQL(request)} />
            </div>
          </div>
          <div style={{flex: 1}}>
            <ResponsePanel content={this.state.response} />
          </div>
        </div>
      </div>
    )
  }
}
