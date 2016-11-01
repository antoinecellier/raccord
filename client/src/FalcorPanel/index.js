import React, { Component } from 'react'
import AceEditor from 'react-ace'
import 'brace/mode/javascript'
import 'brace/theme/github'

import falcor from 'falcor/dist/falcor.all'

export default class FalcorPanel extends Component {
  constructor (props) {
    super(props)
    const model = new falcor.Model({source: new falcor.HttpDataSource('http://localhost:7080/falcor')})

    this.state = {
      request: props.content
    }
    this.handleRequest = request => this.setState({ request })
    this.handleExecute = () => model.get(...JSON.parse(this.state.request)).then(response => response.json).then(this.props.onResponse)
  }

  componentWillReceiveProps (props) {
    this.setState({request: JSON.stringify(props.content, null, 2)})
  }

  render () {
    return (
      <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
        <AceEditor
          mode="javascript"
          theme="github"
          name="falcor_editor"
          fontSize={15}
          width="400px"
          height="680px"
          onChange={this.handleRequest}
          value={this.state.request}
          editorProps={{$blockScrolling: true}}
        />
        <button className="btn btn-primary btn-block" onClick={this.handleExecute}>Fire Falcor!</button>
      </div>
    )
  }
}
