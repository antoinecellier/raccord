import {parse} from 'graphql/language/parser'
import { print } from 'graphql/language/printer'
import _ from 'lodash'
import falcorPathSyntax from 'falcor-path-syntax'
import fetch from 'isomorphic-fetch'

export default function translate (inputFalcor) {
  return getSchema().then(schema => {
    const graphQlQueryAsts = inputFalcor
      .map(path => typeof path === 'string' ? falcorPathSyntax(path) : path)
      .map(path => translatePath(path, schema))
    return print(graphQlQueryAsts[0]) // TODO: support multiple paths by merging the ASTs
  })
}

export function translatePath (path, schema) {
  console.log('Falcor->GraphQL: translating path:', path, schema)
  if (schema) path = chunkByArgs(path, schema)
  const [rootNode] = path.reduce(([rootNode, currentNode = rootNode], pathSegment) => {
    if (pathSegment.kind === 'FieldWithArgs') {
      const node = {
        kind: 'Field',
        name: {kind: 'Name', value: pathSegment.field},
        arguments: _.map(pathSegment.args, (arg, name) => ({
          kind: 'Argument',
          name: {kind: 'Name', value: name},
          value: {kind: `${arg.type}Value`, value: arg.value}
        }))
      }
      currentNode.selectionSet = {
        kind: 'SelectionSet',
        selections: [node]
      }
      return [rootNode, node]
    } else if (pathSegment.kind) {
      pathSegment = pathSegment.field || pathSegment.fields
    }
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
  console.log('Falcor->GraphQL: translation output:', rootGraphQlQuery)
  return rootGraphQlQuery
}

export function chunkByArgs (path, schema) {
  const nodesWithArgs = _(schema.types).flatMap('fields').compact().transform((nodes, node) => {
    nodes[node.name] = _.transform(node.args, (args, arg) => {
      args[arg.name] = arg.type.name || arg.type.ofType.name
    }, {})
  }, {}).value()
  let argsOfCurrentNode = null
  let waitingForArgValue = null
  return path.reduce((newPath, segment) => {
    if (waitingForArgValue) {
      _.last(newPath).args[waitingForArgValue] = {value: segment, type: argsOfCurrentNode[waitingForArgValue]}
      waitingForArgValue = null
      return newPath
    } else if (Array.isArray(segment)) {
      argsOfCurrentNode = null
      return newPath.concat({kind: 'MultipleFields', fields: segment})
    } else if (segment in nodesWithArgs) {
      argsOfCurrentNode = nodesWithArgs[segment]
      return newPath.concat({kind: 'FieldWithArgs', field: segment, args: {}})
    } else if (argsOfCurrentNode && segment in argsOfCurrentNode) {
      waitingForArgValue = segment
      return newPath
    } else {
      argsOfCurrentNode = null
      return newPath.concat({kind: 'Field', field: segment})
    }
  }, [])
}

function getSchema () {
  if (getSchema.schema) return getSchema.schema
  getSchema.schema = fetch('http://127.0.0.1:7080/graphql', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({query: `{
      __schema {
        types {
          name
          fields {
            name
            args {
              name
              type {
                name
                ofType {
                  name
                }
              }
            }
          }
        }
      }
    }`})
  })
  .then(response => response.json())
  .then(response => response.data.__schema)
  return getSchema.schema
}
