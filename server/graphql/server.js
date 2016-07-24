import { GraphQLSchema, GraphQLObjectType, GraphQLList, GraphQLString } from 'graphql'
import graphqlHTTP from 'express-graphql'
import express from 'express'

export class GraphQLServer {

  constructor(port) {
    this.schema = this.defineSchema()
    this.runServer(port, this.schema)
  }

  defineSchema() {
    return new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',
        fields: () => ({
          raccord: {
            type: new GraphQLList(GraphQLString),
            resolve: () => {
              return ["Hello Falcor", "Hello GraphQL"]
            }
          }
        })
      })
    });
  }

  runServer(port, schema) {
    let endpoint = 'graphql'

    express()
      .use(`/${endpoint}`, graphqlHTTP({ schema , pretty: true}))
      .listen(port)

    console.log(`GraphQL server running on http://localhost:${port}/${endpoint}`);
  }
};
