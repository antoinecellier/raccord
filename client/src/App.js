import React, { Component } from 'react'
import FalcorPanel from './FalcorPanel'
import GraphQLPanel from './GraphQLPanel'
import ResponsePanel from './ResponsePanel'
import translateGraphQlToFalcor from './translate/graphql-to-falcor'
import falcor from 'falcor/dist/falcor.all'
import translateFalcorToGraphQl from './translate/falcor-to-graphql'
import './App.css'

export default class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      falcor: {
        model: new falcor.Model({source: new falcor.HttpDataSource('http://localhost:7080/falcor')}),
        request: [[]],
      },
      response: 'none',
    }
  }

  componentWillUpdate(nextProps, nextState) {
    console.log(nextState)
  }

  handleResponse(response) {
    this.setState({response})
  }

  tryTranslateGraphQlToFalcor(request) {
    try {
      const translated = translateGraphQlToFalcor(request)
      return {translated}
    } catch (err) {
      return {err}
    }
  }

  updateFalcorRequest(request) {
    this.setState(prevState => ({
      falcor: Object.assign({}, prevState.falcor, {request})
    }))
  }

  updateGraphqlRequest(request) {
    this.setState({graphql: request})
  }

  handleFalcorRequestChanged(request) {
    this.updateFalcorRequest(request);

    const {err, translated} = this.tryTranslateFalcor(request);
    if (err) return console.error(err)
    else this.updateGraphqlRequest(translated)
  }

  handleGraphQlRequestChanged(request) {
    const {err, translated} = this.tryTranslateGraphQlToFalcor(request)
    if (err) return console.error(err)
    else this.updateFalcorRequest(translated)
  }

  handleRequestFired(request) {
    this.setState({response: undefined})
  }

  handleResponse(response) {
    this.setState({response})
  }

  tryTranslateFalcor(request) {
    try {
      const translated = translateFalcorToGraphQl(request)
      return {translated}
    } catch (err) {
      return {err}
    }
  }

  render () {
    const {falcor, graphql} = this.state
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
            content={graphql}
            onChange={request => this.handleGraphQlRequestChanged(request)}
            onRequestFired={request => this.handleRequestFired(request)}
            onResponse={response => this.handleResponse(response)} />
          <ResponsePanel content={this.state.response} style={{flex: 1, alignSelf: 'center'}} />
        </div>
      </div>
    )
  }
}
