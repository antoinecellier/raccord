import React, { Component } from 'react'
import GraphiQL from 'graphiql'
import fetch from 'isomorphic-fetch'
import './graphiql.css'

export default class GraphQLPanel extends Component {
  constructor (props) {
    super(props)

    this.state = {
      fetcher: (graphQLParams) => {
        if (this.state.query && this.props.onRequestFired) this.props.onRequestFired(this.state.query)
        const graphQLquery = this.state.query ?
          {query: this.state.query, variables: '{}', OperationName: null} :
          graphQLParams
        return fetch('http://127.0.0.1:7080/graphql', {
          method: 'post',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(graphQLquery)
        }).then(response => response.json())
          .then(rep => {
            if (!rep.data.__schema) {
              this.state.displayResponse(rep)
            }
            return rep
          })
      },
      handleQueryChanged: query => {
        console.log(query)
        this.setState({query})
        this.props.onChange(query)
      },
      query: props.content,
      queryResult: '',
      displayResponse: response => {
        this.props.onResponse(response.data)
      }
    }
  }

  handleFireRequest () {
    this.state.fetcher()
  }

  componentDidMount () {
    for (const node of document.querySelectorAll('.cm-s-graphiql textarea')) {
      node.onfocus = () => this.setState({focused: true})
      node.onblur = () => this.setState({focused: false})
    }
  }

  componentWillReceiveProps (nextProps) {
    if (!this.state.focused) {
      this.setState({query: nextProps.content})
    }
  }

  render () {
    return (
      <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
        <GraphiQL fetcher={this.state.fetcher} onEditQuery={this.state.handleQueryChanged} query={this.state.query} />
        <button className="btn btn-primary btn-block" onClick={() => this.handleFireRequest()}>Fire GraphQL!</button>
      </div>
    )
  }
}
