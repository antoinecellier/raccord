import { GraphQLString, GraphQLObjectType, GraphQLNonNull, GraphQLInt, GraphQLEnumType } from 'graphql'


export const stopTimeType = new GraphQLObjectType({
    name: 'StopTime',
    fields: () => ({
      trip_id: { type: new GraphQLNonNull(GraphQLString) },
      arrival_time: { type: new GraphQLNonNull(GraphQLString) },
      departure_time: { type: new GraphQLNonNull(GraphQLString) },
      stop_id: { type: new GraphQLNonNull(GraphQLString) },
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
