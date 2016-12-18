import { GraphQLString, GraphQLObjectType, GraphQLNonNull, GraphQLFloat, GraphQLEnumType, GraphQLList } from 'graphql'
import db, {aql} from '../../db'

import { Route, routeType} from './route'
import { Station, stationType, LocationType, locationTypeEnum} from './station'

export const Stop = `
  type Stop {
    stop_id: String!,
    stop_name: String!,
    stop_lat: Float!,
    stop_lon: Float!,
    parent_station: Station,
    location_type: LocationType,
    routes: [Route],
    wheelchair_boarding: WheelchairBoarding
  }
`

const WheelchairBoarding = `
  enum WheelchairBoarding {
    NoInformation
    Possible
    NotPossible
  }
`

const wheelchairBoardingEnum = new GraphQLEnumType({
  name: 'WheelchairBoarding',
  values: {
    NoInformation: {
      value: 0
    },
    Possible: {
      value: 1
    },
    NotPossible: {
      value: 2
    }
  }
});

export const stopFields = {
  stop_id: { type: new GraphQLNonNull(GraphQLString) },
  stop_name: { type: new GraphQLNonNull(GraphQLString) },
  stop_lat: { type: new GraphQLNonNull(GraphQLFloat) },
  stop_lon: { type: new GraphQLNonNull(GraphQLFloat) },
  parent_station: {
    type: stationType,
    resolve: ({ parent_station }) => {
      return db().query(aql`
        for stop in stops
        filter stop.stop_id == ${parent_station}
        return stop
      `).then(cursor => cursor.next())
        .then(station => station );
    }
  },
  location_type: { type: locationTypeEnum },
  routes: {
    type: new GraphQLList(routeType),
    resolve: ({ stop_id }) => {
      return db().query(aql`
          let stop_times_of_stop = (
            for stop_time in stop_times
            filter stop_time.stop_id == ${stop_id}
            return stop_time.trip_id
          )

          let routes_of_stops = (
            for trip in trips
            filter trip.trip_id in stop_times_of_stop
            return trip.route_id
          )

          for route in routes
          filter route.route_id in routes_of_stops
          return route
        `).then(cursor => cursor.all())
    }
  },
  wheelchair_boarding: { type: wheelchairBoardingEnum }
}

export const stopType = new GraphQLObjectType({
    name: 'Stop2',
    fields: () => (stopFields)
})

export function stopDbId (stopDtoId) {
  return 'StopPoint:' + stopDtoId
}
