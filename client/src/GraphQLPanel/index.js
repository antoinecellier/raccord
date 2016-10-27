import React, { Component } from 'react'
import GraphiQL from 'graphiql';
import fetch from 'isomorphic-fetch';
import './graphiql.css';

export default class GraphQLPanel extends Component {
  constructor(props) {
    super(props);

    this.state = {
      fetcher: (graphQLParams) => {
        const graphQLquery = this.state.query ? {query: this.state.query, variables: "{}", OperationName: null} : graphQLParams
        return fetch('http://127.0.0.1:7080/graphql', {
          method: 'post',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(graphQLquery),
        }).then(response => {
          return response.json()
        })
          .then(rep => {
            if(!rep.data.__schema){
              this.state.displayResponse(rep)
            }
            return rep;
          })
      },
      onEditQuery: query => {
        this.setState({query})
        // TODO: Execute query translate function
      },
      query: null,
      queryResult: '',
      displayResponse: response => {
        this.props.onResponse(response.data);
        //this.setState({queryResult: JSON.stringify(rep.data)})
      }
    };

    console.log(this.state.query)
  }

  render () {
    return (
      <div className="col-md-6">
        <GraphiQL fetcher={this.state.fetcher} onEditQuery={this.state.onEditQuery} />
        <button className="btn btn-primary btn-block" onClick={this.state.fetcher}>Fire GraphQL!</button>
      </div>
    )
  }
}
