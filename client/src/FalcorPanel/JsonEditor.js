import React, { Component } from 'react'
import AceEditor from 'react-ace'
import 'brace/mode/json'
import 'brace/theme/github'

const tabSize = 2

export default class JsonEditor extends Component {
  constructor (props) {
    super(props)
    this.state = {
      textContent: this.asText(props.value),
      focused: false,
    }
  }

  asText (json) {
    return JSON.stringify(json, null, tabSize)
  }

  handleTextContentChange (newTextContent) {
    try {
      this.setState({textContent: newTextContent})
      const newJsonContent = JSON.parse(newTextContent)
      this.props.onChange(newJsonContent)
    } catch (err) {
      // ignore invalid JSON
    }
  }

  handleFocus () {
    this.setState({focused: true})
  }

  handleBlur () {
    this.setState({focused: false})
  }

  componentWillReceiveProps (nextProps) {
    if (!this.state.focused) this.setState({textContent: this.asText(nextProps.value)})
  }

  render () {
    return (
      <AceEditor
        mode="json"
        theme="github"
        tabSize={tabSize}
        value={this.state.textContent}
        onChange={newTextContent => this.handleTextContentChange(newTextContent)}
        onFocus={() => this.handleFocus()}
        onBlur={() => this.handleBlur()}
        editorProps={{$blockScrolling: Infinity}}
      />
    )
  }
}
