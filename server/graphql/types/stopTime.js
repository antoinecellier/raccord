import { GraphQLString, GraphQLObjectType, GraphQLNonNull, GraphQLInt, GraphQLEnumType } from 'graphql'
import db, {aql} from '../../db'

import {stopType} from './stop'

export const stopTimeType = new GraphQLObjectType({
    name: 'StopTime',
    fields: () => ({
      trip_id: { type: new GraphQLNonNull(GraphQLString) },
      arrival_time: { type: new GraphQLNonNull(GraphQLString) },
      departure_time: { type: new GraphQLNonNull(GraphQLString) },
      stop: {
        type: new GraphQLNonNull(stopType),
        resolve: ({ stop_id }) => {
          console.log(stop_id);
          return db().query(aql`
              for stop in stops
              filter stop.stop_id == ${stop_id}
              return stop
            `).then(cursor => cursor.next() )
              .then(stop => stop )
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
    CoordinateDriver: {
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
