import React, { Component } from 'react'

export default class ResponsePanel extends Component {
  render () {
    return (
      <div style={{flex: 1}}>
        <textarea value={JSON.stringify(this.props.content, null, 2)} readOnly className="form-control" rows="32" style={{fontFamily: 'monospace'}} />
      </div>
    )
  }
}
