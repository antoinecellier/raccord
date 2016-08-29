import express from 'express'
import bodyParser from 'body-parser'
import {dataSourceRoute as falcor} from 'falcor-express'
import FalcorRouter from 'falcor-router'

const routes = [
  {
    route: 'hello',
    get (paths) {
      return [{path: paths, value: paths[0]}]
    }
  }
]

export default express.Router()

  .use(bodyParser.urlencoded({extended: false}))

  .use('/', falcor(() => new FalcorRouter(routes)))
