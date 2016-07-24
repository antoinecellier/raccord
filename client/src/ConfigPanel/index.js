import React, { Component } from 'react';

export default class ConfigPanel extends Component {
  constructor(props) {
      super(props);
      this.state = {
        source: "rest"
      }

      this.config = {
        source: {
          rest: "rest",
          database: "database"
        }
      }
  }

  handleSource(e) {
    this.setState({
      source: e.target.value
    })
  }

  render() {
    return (
      <div className="panel panel-info">
        <div className="panel-heading">
          <h3 className="panel-title">Configuration</h3>
        </div>
        <div className="panel-body">
          <div className="row">
            <div className="col-md-1">
              <h4>Source:</h4>
            </div>
            <div className="col-md-2">
              <div className="radio">
                <label>
                  <input type="radio" name="source" id="rest" value={this.config.source.rest}
                         onChange={this.handleSource.bind(this)}
                         checked={ this.state.source === this.config.source.rest} />
                  Rest Web Service
                </label>
              </div>
              <div className="radio">
                <label>
                  <input type="radio" name="source" id="db" value={this.config.source.database}
                         onChange={this.handleSource.bind(this)}
                         checked={ this.state.source === this.config.source.database} />
                  Database
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
