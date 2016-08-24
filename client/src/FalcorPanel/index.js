import React, { Component } from 'react';
import AceEditor from 'react-ace';
import 'brace/mode/javascript';
import 'brace/theme/github';

export default class FalcorPanel extends Component {
  constructor(props) {
    super(props)
    this.state = {
      request: ''
    }
    this.handleRequest = request => this.setState({ request });
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
          height={200}
          onChange={this.handleRequest}
          value={this.state.request}
          editorProps={{$blockScrolling: true}}
        />
      </div>
    );
  }
}
