import React, { Component } from 'react'
import AceEditor from 'react-ace'
import 'brace/mode/javascript'
import 'brace/theme/github'

export default class GraphQLPanel extends Component {
  constructor (props) {
    super(props)

    this.state = {
      request: ''
    }
    this.handleRequest = request => {
      this.setState({ request })
      this.props.onChange(request)
    }
    this.handleExecute = () => {}
  }

  render () {
    return (
      <div className="col-md-6">
        GraphQL
        <AceEditor
          mode="javascript"
          theme="github"
          name="graphql_editor"
          fontSize={15}
          height="8em"
          onChange={this.handleRequest}
          value={this.state.request}
          editorProps={{$blockScrolling: true}}
        />
        <button className="btn btn-primary btn-block" onClick={this.handleExecute}>Fire GraphQL!</button>
      </div>
    )
  }
}
