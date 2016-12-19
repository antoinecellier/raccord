import DataLoader from 'dataloader'
import { map } from 'lodash'
import db, {aql} from '../../db'
import Route from './route'

const Station = `
  type Station {
    id: String!,
    label: String!,
    latitude: Float!,
    longitude: Float!,
    routes(from: Int!, length: Int!): [Route]
  }
`

export default () => [Station, Route]

export const resolvers = {
  Station: {
    id ({ stop_id }) {
      return stop_id.split(':')[1]
    },
    label ({ stop_name }) {
      return stop_name
    },
    latitude ({ stop_lat }) {
      return stop_lat
    },
    longitude ({ stop_lon }) {
      return stop_lon
    },
    routes ({ stop_id }, { from, length }) {
      return RoutesByStationIdLoader.load({ stop_id, from, length })
    }
  }
}

const getRoutesByStationIds = (stopIds) => {
  const { from, length } = stopIds[0]
  stopIds = map(stopIds, 'stop_id')

  return new Promise((resolve, reject) => {
    db().query(aql`
      for stopId in ${stopIds}
        let from = stopId.from

        let stops = (
          for stop in stops
          filter stop.parent_station == stopId
          return stop.stop_id
        )

        let stop_times_of_stop = (
          for stop_time in stop_times
          filter stop_time.stop_id in stops
          return stop_time.trip_id
        )

        let routes_of_stops = (
          for trip in trips
          filter trip.trip_id in stop_times_of_stop
          return trip.route_id
        )

        let routes = (
          for route in routes
          filter route.route_id in routes_of_stops
          limit ${from}, ${length}
          return route
        )

      return routes
    `).then(cursor => cursor.all())
      .then(routes => resolve(routes))
  });
}

const RoutesByStationIdLoader = new DataLoader(getRoutesByStationIds);

export function stationDbId (stationDtoId) {
  return 'StopArea:' + stationDtoId
}
