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
      <div>
        GraphQL
        <AceEditor
          mode="javascript"
          theme="github"
          name="graphql_editor"
          fontSize={15}
          width="100px"
          height="20em"
          onChange={this.handleRequest}
          value={this.state.request}
          editorProps={{$blockScrolling: true}}
        />
        <button className="btn btn-primary btn-block" onClick={this.handleExecute}>Fire GraphQL!</button>
      </div>
    )
  }
}
