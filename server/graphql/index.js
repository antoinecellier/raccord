import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLList, GraphQLInt } from 'graphql'
import graphqlHTTP from 'express-graphql'
import express from 'express'
import co from 'co'
import db, {aql} from '../db'

import {stopType} from './types/stop'

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
      stations: {
        type: new GraphQLList(stopType),
        args: {
          search: { type: GraphQLString },
          from: { type: GraphQLInt },
          length: { type: GraphQLInt }
        },
        resolve: (_, { search, from, length }) => {
          return db().query(aql`
              for stop in (${search} ? fulltext(stops, "stop_name", concat("prefix:", ${search})) : stops)
              filter stop.location_type == 1
              sort stop.stop_name asc
              limit ${from}, ${length}
              return stop
            `).then(cursor => cursor.all())
        }
      },
    })
  })
})

export default express.Router()

  .use('/', graphqlHTTP({ schema , pretty: true, graphiql: true}));
