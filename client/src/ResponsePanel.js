import React, { Component } from 'react'

export default class ResponsePanel extends Component {
  render () {
    return (
      <div className="col-xs-12">
        <textarea value={JSON.stringify(this.props.content, null, 2)} readOnly className="form-control" rows="20" />
      </div>
    )
  }
}
