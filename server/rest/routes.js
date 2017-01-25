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
  // if it's parsable as a number, it will be a number in the db
  // courtesy of our import technique and/or Arango type inference :(
  const asNumber = Number(routeDtoId)
  return isNaN(asNumber) ? routeDtoId : asNumber
}

export function routeDtoId (routeDbId) {
  return `routes/${routeDbId}`
}

export function routeDto ({route_id, route_short_name, route_long_name}) {
  return {
    href: routeDtoId(route_id),
    label: String(route_short_name),
    trip: route_long_name
  }
}
