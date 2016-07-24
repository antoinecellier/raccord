import React, { Component } from 'react';
import Header from './Header'
import ConfigPanel from './ConfigPanel'

export default class App extends Component {
  render() {
    return (
      <div>
        <Header />
        <div className="container">
          <ConfigPanel />
        </div>
      </div>
    );
  }
}
