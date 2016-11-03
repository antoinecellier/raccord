import React, { Component } from 'react'
import loader from 'hoc-react-loader'

export default loader(class ResponsePanel extends Component {
  render () {
    return (
        this.props.content !== 'none' ?
          <textarea
            value={JSON.stringify(this.props.content, null, 2)}
            readOnly
            className="form-control"
            style={{flex: 1, fontFamily: 'monospace'}} /> :
          <p style={{flex: 1, alignSelf: 'center', textAlign: 'center'}}>
            Nothing to display here yet. Fire a request and the response will be displayed here!
          </p>
    )
  }
}, {wait: ['content']})
