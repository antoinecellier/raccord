import React, { Component } from 'react';
import AceEditor from 'react-ace';
import 'brace/mode/javascript';
import 'brace/theme/github';

import falcor from 'falcor/dist/falcor.all'

export default class FalcorPanel extends Component {
  constructor(props) {
    super(props)
    const model = new falcor.Model({source: new falcor.HttpDataSource('https://localhost:7081/falcor')})

    this.state = {
      request: ''
    }
    this.handleRequest = request => this.setState({ request });
    this.handleExecute = () => model.get(...JSON.parse(this.state.request)).then(console.log.bind(console))
  }

  render() {
    return (
      <div className="col-md-6">
        Falcor
        <AceEditor
          mode="javascript"
          theme="github"
          name="falcor_editor"
          fontSize={15}
          height="8em"
          onChange={this.handleRequest}
          value={this.state.request}
          editorProps={{$blockScrolling: true}}
        />
        <button className="btn" onClick={this.handleExecute}>Get</button>
      </div>
    );
  }
}
