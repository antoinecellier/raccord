import React, { Component } from 'react'
import loader from 'hoc-react-loader'

export default loader(class ResponsePanel extends Component {
  render () {
    const {content} = this.props
    if (content === 'none') {
      return (
        <p style={{flex: 1, alignSelf: 'center', textAlign: 'center'}}>
          Nothing to display here yet. Fire a request and the response will be displayed here!
        </p>
      )
    } else if (content.err) {
      return (
        <p style={{flex: 1, alignSelf: 'center', textAlign: 'center'}}>
          <span style={{color: 'red'}}>Error! You <strong>suck</strong>! {content.err.toString()}</span>
        </p>
      )
    } else {
      return (
        <pre style={{flex: 1}}>
          {JSON.stringify(this.props.content, null, 2)}
        </pre>
      )
    }
  }
}, {wait: ['content']})
