import React, { Component } from 'react'

export default class Header extends Component {
  render () {
    return (
      <nav className="navbar navbar-inverse">
        <div className="container">
          <div className="navbar-header">
            <a className="navbar-brand" href="#">Raccord</a>
          </div>
        </div>
      </nav>
    )
  }
}
