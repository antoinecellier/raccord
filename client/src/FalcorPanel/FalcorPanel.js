import React, { Component } from 'react'
import JsonEditor from './JsonEditor'

export default class FalcorPanel extends Component {
  handleRequestChange (newRequest) {
    this.props.onRequestChange(newRequest)
  }

  handleFireRequest () {
    this.props.model.get(...this.props.request)
      .then(response => response.json)
      .then(this.props.onResponse)
  }

  render () {
    return (
      <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
        <JsonEditor value={this.props.request} onChange={json => this.handleRequestChange(json)} />
        <button className="btn btn-primary btn-block" onClick={() => this.handleFireRequest()}>Fire Falcor!</button>
      </div>
    )
  }
}
