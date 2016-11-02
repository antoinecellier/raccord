import React, { Component } from 'react'
import FalcorPanel from './FalcorPanel'
import GraphQLPanel from './GraphQLPanel'
import ResponsePanel from './ResponsePanel'
import translateGraphQlToFalcor from './translate/graphql-to-falcor'
import falcor from 'falcor/dist/falcor.all'

export default class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      falcor: {
        model: new falcor.Model({source: new falcor.HttpDataSource('http://localhost:7080/falcor')}),
        request: [[]],
        handleRequestChange: request => this.setState(prevState => ({falcor: Object.assign({}, prevState.falcor, {request})})),
        handleResponse: response => this.setState({response}),
      },
      response: ''
    }
  }

  tryTranslateGraphQL(request) {
    try {
      const falcorRequest = translateGraphQlToFalcor(request)
      this.state.falcor.handleRequestChange(falcorRequest)
    } catch (e) {
      console.error(e)
    }
  }

  render () {
    const falcor = this.state.falcor
    return (
      <div>
        <div style={{display: 'flex', flexDirection: 'row', height: '70em'}}>
          <FalcorPanel
            model={falcor.model}
            request={falcor.request}
            onRequestChange={request => falcor.handleRequestChange(request)}
            onResponse={response => falcor.handleResponse(response)} />
          <GraphQLPanel onChange={request => this.tryTranslateGraphQL(request)} onResponse={response => this.handleResponse(response)} />
          <ResponsePanel content={this.state.response} />
        </div>
      </div>
    )
  }
}
