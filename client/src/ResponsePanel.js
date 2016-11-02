import React, { Component } from 'react'

export default class ResponsePanel extends Component {
  render () {
    return (
      <div style={{display: 'flex', flex: 1}}>
        <textarea
          value={JSON.stringify(this.props.content, null, 2)}
          readOnly
          className="form-control"
          style={{height: null, flex: 1, fontFamily: 'monospace'}} />
      </div>
    )
  }
}
