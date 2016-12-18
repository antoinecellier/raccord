import db, {aql} from '../../db'

const Route = `
  type Route {
    id: String!,
    label: String!,
    trip: String!
  }
`

export const resolvers = {
  Route: {
    id({ route_id }) {
      return route_id.split('-')[0]
    },
    label({ route_short_name }) {
      return route_short_name
    },
    trip({ route_long_name }) {
      return route_long_name
    }
  }
}

export default () => [Route]
//
// export const routeType = new GraphQLObjectType({
//     name: 'Route',
//     fields: () => ({
//       id: {
//         type: new GraphQLNonNull(GraphQLString),
//         resolve: ({ route_id }) => route_id.split('-')[0]
//       },
//       label: {
//         type: new GraphQLNonNull(GraphQLString),
//         resolve: ({ route_short_name }) => route_short_name
//       },
//       trip: {
//         type: new GraphQLNonNull(GraphQLString),
//         resolve: ({ route_long_name }) => route_long_name
//       }
//     })
// })
