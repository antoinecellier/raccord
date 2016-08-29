import express from 'express'
import co from 'co-express'
import boom from 'boom'
import db, {aql} from '../db'

export default express.Router()

  .get('/routes/:id', co(function* (req, res) {
    const id = req.params.id
    const cursor = yield db().query(aql`
      for route in routes
      filter route.route_id == ${routeDbId(id)}
      return route
    `)
    const route = yield cursor.next()
    if (!route) throw boom.notFound()
    res.json(routeDto(route))
  }))


export function routeDbId (routeDtoId) {
  return `${routeDtoId}-0`
}

export function routeDtoId (routeDbId) {
  return 'routes/' + routeDbId.split('-')[0]
}

export function routeDto ({route_id, route_short_name, route_long_name}) {
  return {
    href: routeDtoId(route_id),
    shortName: String(route_short_name),
    longName: route_long_name
  }
}
