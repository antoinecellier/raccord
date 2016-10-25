import { GraphQLString, GraphQLObjectType, GraphQLNonNull, GraphQLInt, GraphQLEnumType } from 'graphql'
import db, {aql} from '../../db'

import {stopType} from './stop'
import {stationType} from './station'
import {tripType} from './trip'
import {routeType} from './route'

export const stopTimeType = new GraphQLObjectType({
    name: 'StopTime',
    fields: () => ({
      id: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: ({ _id }) => _id
      },
      direction: {
        type: new GraphQLNonNull(tripType),
        resolve: ({ trip_id }) => {
          return db().query(aql`
            for trip in trips
            filter trip.trip_id == ${trip_id}
            return trip
            `).then(cursor => cursor.next())
              .then(direction => direction)
        }
      },
      route: {
        type: new GraphQLNonNull(routeType),
        resolve: ({ trip_id }) => {
          console.log(trip_id);
          return db().query(aql`
              let routeID = (for trip in trips
                filter trip.trip_id == ${trip_id}
                return trip.route_id)

              for route in routes
              filter route.route_id in routeID
              return route
            `).then(cursor => cursor.next())
              .then(route => route )
        }
      },
      trip: {
        type: new GraphQLNonNull(tripType),
        resolve: ({ trip_id }) => {
          return db().query(aql`
            for trip in trips
            filter trip.trip_id == ${trip_id}
            return trip
            `).then(cursor => cursor.next())
              .then(trip => trip)
        }
      },
      time: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: ({ departure_time }) => departure_time
      },
      station: {
        type: new GraphQLNonNull(stationType),
        resolve: ({ stop_id }) => {
          return db().query(aql`
              for stop in stops
              filter stop.stop_id == ${stop_id}
              return stop
            `).then(cursor => cursor.next() )
              .then(station => station )
        }
      },
      stop_sequence: { type: new GraphQLNonNull(GraphQLInt) },
      drop_off_type: { type: DropOffType },
      pickup_type: { type: PickupType },
    })
})


const PickupType = new GraphQLEnumType({
  name: 'PickupType',
  values: {
    RegularlyScheduled: {
      value: 0
    },
    NoPickup: {
      value: 1
    },
    PhoneAgency: {
      value: 2
    },
    CoordinateWithDriver: {
      value: 3
    }
  }
});

const DropOffType = new GraphQLEnumType({
  name: 'DropOffType',
  values: {
    RegularlyScheduled: {
      value: 0
    },
    NoDrop: {
      value: 1
    },
    PhoneAgency: {
      value: 2
    },
    CoordinateDriver: {
      value: 3
    }
  }
});
