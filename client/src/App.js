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
      },
      response: '',
    }
  }

  tryTranslateGraphQlToFalcor(request) {
    try {
      const translated = translateGraphQlToFalcor(request)
      return {translated}
    } catch (err) {
      return {err}
    }
  }

  handleFalcorRequestChanged(request) {
    this.setState(prevState => ({
      falcor: Object.assign({}, prevState.falcor, {request})
    }))
  }

  handleGraphQlRequestChanged(request) {
    const {err, translated} = this.tryTranslateGraphQlToFalcor(request)
    if (err) return console.error(err)
    else this.handleFalcorRequestChanged(translated)
  }

  handleRequestFired(request) {
    this.setState({response: undefined})
  }

  handleResponse(response) {
    this.setState({response})
  }

  render () {
    const falcor = this.state.falcor
    return (
      <div>
        <div style={{display: 'flex', flexDirection: 'row', height: '100vh'}}>
          <FalcorPanel
            model={falcor.model}
            request={falcor.request}
            onRequestChange={request => this.handleFalcorRequestChanged(request)}
            onRequestFired={request => this.handleRequestFired(request)}
            onResponse={response => this.handleResponse(response)} />
          <GraphQLPanel
            onChange={request => this.handleGraphQlRequestChanged(request)}
            onRequestFired={request => this.handleRequestFired(request)}
            onResponse={response => this.handleResponse(response)} />
          <ResponsePanel content={this.state.response} style={{flex: 1}} />
        </div>
      </div>
    )
  }
}
