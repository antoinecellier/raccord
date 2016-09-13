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

export function stopDbId (stopDtoId) {
  return 'StopPoint:' + stopDtoId
}

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

const locationTypeEnum = new GraphQLEnumType({
  name: 'LocationType',
  values: {
    SeveralStop: {
      value: 0
    },
    UniqueStation: {
      value: 1
    }
  }
});
