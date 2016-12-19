import graphqlHTTP from 'express-graphql'
import { makeExecutableSchema } from 'graphql-tools'
import { merge } from 'lodash'
import express from 'express'

import Query, { resolvers as queryResolvers } from './queries'
import Route, { resolvers as routeResolvers } from './types/route'
import Station, { resolvers as stationResolvers } from './types/station'
import Stop, { resolvers as stopResolvers } from './types/stop'
import FavoriteStop, { resolvers as favoriteStopResolvers } from './types/favoriteStop'
import StopTime, { resolvers as stopTimeResolvers } from './types/stopTime'
import Trip, { resolvers as tripResolvers } from './types/trip'
import Mutation, { resolvers as mutationResolvers } from './mutations'

const SchemaDefinition = `
  schema {
    query: Query,
    mutation: Mutation
  }
`
const typeDefs = [SchemaDefinition, Query, Mutation, Route, Station, Stop, FavoriteStop, StopTime, Trip]
const resolvers = merge(queryResolvers, mutationResolvers, routeResolvers, stationResolvers, stopResolvers, favoriteStopResolvers, stopTimeResolvers, tripResolvers)

const schema = makeExecutableSchema({ typeDefs, resolvers })

export default express.Router()
  .use('/', graphqlHTTP({ schema, pretty: true, graphiql: true }))
