import { GraphQLError, GraphQLScalarType, Kind } from 'graphql'

export const GraphQLMaxLengthString = length => {
  return new GraphQLScalarType({
    name: 'MaxLengthString',
    serialize: value => {
      if(value.length > length) {
        throw new GraphQLError('Query error: Not a valid string', [value]);
      }

      return value;
    },
    parseValue: value => {
      return value;
    },
    parseLiteral: ast => {
      if (ast.kind !== Kind.STRING) {
        throw new GraphQLError('Query error: Can only parse strings got a: ' + ast.kind, [ast]);
      }
      console.log(ast);
      if(ast.value.length > length) {
        throw new GraphQLError('Query error: Not a valid string', [ast]);
      }

      return ast.value;
    }
  });
}
