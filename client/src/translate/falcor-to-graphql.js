import {parse} from 'graphql/language/parser'
import { print } from 'graphql/language/printer'
import _ from 'lodash'
import falcorPathSyntax from 'falcor-path-syntax'

export default function translate (inputFalcor) {
  const graphQlQueryAsts = inputFalcor
    .map(path => typeof path === 'string' ? falcorPathSyntax(path) : path)
    .map(path => translatePath(path))
  return print(graphQlQueryAsts[0]) // TODO: support multiple paths by merging the ASTs
}

export function translatePath (path) {
  console.debug('Falcor->GraphQL: translating path:', path)
  const [rootNode] = path.reduce(([rootNode, currentNode = rootNode], pathSegment) => {
    const normalizedPathSegment = Array.isArray(pathSegment) ? pathSegment : [pathSegment]
    const nodes = normalizedPathSegment.map(nestedSegment => ({kind: 'Field', name: {kind: 'Name', value: nestedSegment}}))
    currentNode.selectionSet = {
      kind: 'SelectionSet',
      selections: nodes
    }
    return [rootNode, nodes[0]]
  }, [{}])
  const rootGraphQlQuery = {
    kind: 'Document',
    definitions: [
      {
        kind: 'OperationDefinition',
        operation: 'query',
        selectionSet: rootNode.selectionSet
      }
    ]
  }
  console.debug('Falcor->GraphQL: translation output:', rootGraphQlQuery)
  return rootGraphQlQuery
}
