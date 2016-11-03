import React, { Component } from 'react'
import loader from 'hoc-react-loader'

export default loader(class ResponsePanel extends Component {
  render () {
    return (
      <div style={{display: 'flex', flex: 1}}>
        <textarea
          value={JSON.stringify(this.props.content, null, 2)}
          readOnly
          className="form-control"
          style={{flex: 1, fontFamily: 'monospace'}} />
      </div>
    )
  }
}, {wait: ['content']})
