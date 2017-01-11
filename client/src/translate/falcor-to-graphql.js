import {parse} from 'graphql/language/parser'
import { print } from 'graphql/language/printer'
import _ from 'lodash'
import falcorPathSyntax from 'falcor-path-syntax'
import fetch from 'isomorphic-fetch'

export default function translate (inputFalcor) {
  // TODO: start by optimizing the Falcor path to reduce the number of paths (there's a falcor util for that)
  return getSchema().then(schema => {
    const graphQlQueryAsts = inputFalcor
      .map(path => typeof path === 'string' ? falcorPathSyntax(path) : path)
      .map(path => translatePath(path, typesOfArgsByField(schema)))
    const mergedGraphQlQueryAsts = _.mergeWith(...graphQlQueryAsts, (left, right, key) => {
      // TODO: avoid the 'definitions' special case by concatenating definitions before forming a document.
      // TODO: merge nodes based on functional identity (e.g. two selections are equal if same name and same args).
      if (Array.isArray(left) && key !== 'definitions') return left.concat(right)
    })
    return print(mergedGraphQlQueryAsts)
  })
}

/**
 * Translate a falcor path to GraphQL document.
 */
export function translatePath (path, schema) {
  // TODO: move those logs one level up the stack
  console.log('Falcor->GraphQL: translating path:', path, schema)
  const argAwarePath = groupArgs(path, schema)
  const rootGraphQlQuery = {
    kind: 'Document',
    definitions: [
      {
        kind: 'OperationDefinition',
        operation: 'query',
        selectionSet: {
          kind: 'SelectionSet',
          selections: translateArgAwarePath(argAwarePath)
        }
      }
    ]
  }
  console.log('Falcor->GraphQL: translation output:', rootGraphQlQuery)
  return rootGraphQlQuery
}

/**
 * Translates a path returned by groupArgs to a GraphQL selections array.
 */
function translateArgAwarePath (path) {
  if (path.length === 0) return []
  const [{field, args}, ...rest] = path
  const fields = Array.isArray(field) ? field : [field]
  return fields.map(field => {
    const gqlNode = {
      kind: 'Field',
      name: {
        kind: 'Name',
        value: field
      },
      arguments: _.map(args, ({value, type}, name) => ({
        kind: 'Argument',
        name: {kind: 'Name', value: name},
        value: {kind: `${type}Value`, value}
      })),
      selectionSet: {
        kind: 'SelectionSet',
        selections: translateArgAwarePath(rest)
      }
    }
    if (_.isEmpty(gqlNode.arguments)) delete gqlNode.arguments
    if (_.isEmpty(gqlNode.selectionSet.selections)) delete gqlNode.selectionSet
    return gqlNode
  })
}

/**
 * Returns a simplified schema to pass to groupArgs.
 */
export function typesOfArgsByField (schema = {}) {
  // TODO: handle fields with same name (i.e. namespace by types)
  return _(schema.types).flatMap('fields').compact().transform((nodes, node) => {
    nodes[node.name] = _.transform(node.args, (args, arg) => {
      args[arg.name] = arg.type.name || arg.type.ofType.name
    }, {})
  }, {}).value()
}

/**
 * Groups fields with their arguments. Uses the GraphQL schema to detect
 * arguments.
 *
 * @argument path falcor path
 * @argument schema output from typesOfArgsByField
 */
export function groupArgs (path, schema = {}) {
  if (path.length === 0) return []
  const [field, ...maybeArgs] = path
  const args = _(maybeArgs)
    .chunk(2)
    .takeWhile(([name]) => name in (schema[field] || {}))
    .fromPairs()
    .mapValues((value, name) => ({value: value || '', type: schema[field][name]}))
    .value()
  const restOfPath = _.drop(maybeArgs, Object.keys(args).length * 2)
  return [{field, args}, ...groupArgs(restOfPath, schema)]
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
