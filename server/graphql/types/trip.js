import db, {aql} from '../../db'
import Route from './route'

export const Trip = `
  type Trip {
    trip_id: String!,
    service_id: String!,
    direction_id: Int,
    label: String,
    route: Route!
  }
`

export default () => [Trip, Route]

export const resolvers = {
  Trip: {
    label ({ trip_headsign }) {
      return trip_headsign
    },
    route ({ route_id }) {
      return db().query(aql`
          for route in routes
          filter route.route_id == ${route_id}
          return route
        `).then(cursor => cursor.next())
    }
  }
}
