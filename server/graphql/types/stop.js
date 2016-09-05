import { GraphQLString, GraphQLObjectType, GraphQLNonNull, GraphQLFloat, GraphQLEnumType } from 'graphql'


export const stopType = new GraphQLObjectType({
    name: 'Stop',
    fields: () => ({
      stop_id: { type: new GraphQLNonNull(GraphQLString) },
      stop_name: { type: new GraphQLNonNull(GraphQLString) },
      stop_lat: { type: new GraphQLNonNull(GraphQLFloat) },
      stop_lon: { type: new GraphQLNonNull(GraphQLFloat) },
      parent_station: { type: GraphQLString },
      location_type: { type: locationTypeEnum },
      wheelchair_boarding: { type: wheelchairBoardingEnum },
    })
})

const wheelchairBoardingEnum = new GraphQLEnumType({
  name: 'WheelchairBoarding',
  values: {
    ZERO: {
      value: 0
    },
    ONE: {
      value: 1
    },
    TWO: {
      value: 2
    }
  }
});

const locationTypeEnum = new GraphQLEnumType({
  name: 'LocationType',
  values: {
    ZERO: {
      value: 0
    },
    ONE: {
      value: 1
    }
  }
});
