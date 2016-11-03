import React, { Component } from 'react'

export default class ResponsePanel extends Component {
  render () {
    return (
      <div style={{display: 'flex', flex: 1}}>
        <pre style={{flex: 1}}>
          {JSON.stringify(this.props.content, null, 2)}
        </pre>
      </div>
    )
  }
}
