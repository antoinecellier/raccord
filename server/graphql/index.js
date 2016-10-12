import { GraphQLSchema } from 'graphql'
import graphqlHTTP from 'express-graphql'
import express from 'express'

import query from './queries'
import mutation from './mutations'

const schema = new GraphQLSchema({query, mutation})

export default express.Router()
  .use('/', graphqlHTTP({ schema , pretty: true, graphiql: false}));
