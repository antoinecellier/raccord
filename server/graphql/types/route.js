const Route = `
  type Route {
    id: String!,
    label: String!,
    trip: String!
  }
`

export default () => [Route]

export const resolvers = {
  Route: {
    id ({ route_id }) {
      return route_id
    },
    label ({ route_short_name }) {
      return route_short_name
    },
    trip ({ route_long_name }) {
      return route_long_name
    }
  }
}
