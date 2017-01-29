import _ from 'lodash'
import falcorPathSyntax from 'falcor-path-syntax'
import falcorPathUtils from 'falcor-path-utils'
import fetch from 'isomorphic-fetch'
import {print} from 'graphql/language/printer'
import {buildClientSchema, introspectionQuery} from 'graphql/utilities'
import {getNamedType} from 'graphql/type'

/**
 * JSDoc not meant to be 100% correct but hints for humans.
 *
 * @typedef {object} FalcorRange http://netflix.github.io/falcor/doc/global.html#Range
 * @typedef {(string|FalcorRange)} FalcorPathSegment
 * @typedef {FalcorPathSegment[]} FalcorPath
 * @typedef {string} FalcorPathSyntaxCode
 * @typedef {(FalcorPath|FalcorPathSyntaxCode)[]} FalcorPathSet
 */

/**
 * @param {FalcorPathSet} inputFalcor
 */
export default function translate (inputFalcor) {
  /** @type {FalcorPath[]} */ const parsedInputFalcor = inputFalcor.map(path => typeof path === 'string' ? falcorPathSyntax(path) : path)
  /** @type {FalcorPath[]} */ const collapsedInputFalcor = falcorPathUtils.collapse(parsedInputFalcor) // not really useful since collapseSelections would do that, but hey, less work! :D
  return getSchema().then(schema => {
    console.log('Falcor->GraphQL: translating path:', collapsedInputFalcor, schema)
    const graphQlSelections = collapsedInputFalcor
      .map(path => translatePath(path, schema))
      .reduce((all, selections) => all.concat(selections))
    const outputGraphQlAst = wrapInQuery(aliasSelections(collapseSelections(graphQlSelections)))
    console.log('Falcor->GraphQL: translation output:', outputGraphQlAst)
    return print(outputGraphQlAst)
  })
}

/**
 * Wraps a GraphQL selections array into a full GraphQL query.
 */
function wrapInQuery (selections) {
  return {
    kind: 'Document',
    definitions: [
      {
        kind: 'OperationDefinition',
        operation: 'query',
        selectionSet: {
          kind: 'SelectionSet',
          selections
        }
      }
    ]
  }
}

/**
 * Merges GraphQL selections that have the same prefix (same field, same args). This will yield more compact queries.
 *
 * @example a{b} and a{c} => a{b,c}
 */
export function collapseSelections (selections) {
  // This function recursively merges selections bottom up.
  return _(selections)
    .groupBy(selection => selection.name.value + _.map(selection.arguments, arg => arg.name.value + arg.value.value).join(''))
    .map(group => _.mergeWith(...group, (left, right, key) => {
      if (key === 'selections') return collapseSelections(left.concat(right))
    }))
    .value()
}

/**
 * Defines alias for fields where the query would otherwise be invalid.
 * This happens when a field is requested multiple times with different arguments.
 *
 * @example a(b:1){},a(b:2){} => a1:a(b:1){},a2:a(b:2){}
 *
 * Use collapseSelections first to merge selections that can be merged instead of aliased.
 *
 */
export function aliasSelections (selections) {
  return _(selections)
    .groupBy(selection => selection.name.value)
    .map(group => group.length > 1 ? _.map(group, selection => Object.assign({}, selection, {
      alias: {
        kind: 'Name',
        value: selection.name.value + _.uniqueId()
      }
    })) : group)
    .flatten()
    .map(selection => {
      const nestedSelections = _.get(selection, 'selectionSet.selections')
      return nestedSelections
        ? _.set(selection, 'selectionSet.selections', aliasSelections(nestedSelections))
        : selection
    })
    .value()
}

/**
 * Translate a falcor path to a GraphQL selections array.
 *
 * @param {FalcorPath}
 * @param {GraphQLSchema=}
 * @returns {object[]} a GraphQL selections array; pass it to wrapInQuery to make a full GraphQL query
 */
export function translatePath (path, schema) {
  return translateArgAwarePath(groupArgs(path, 'Query', schema))
}

/**
 * These are used below, in translateArgAwarePath and groupArgs. They describe a intermediate representation
 * between a Falcor path and the corresponding GraphQL selections array.
 *
 * @typedef {FieldArgsGroup[]} ArgAwarePath
 *
 * @typedef {object} FieldArgsGroup
 * @property {string} field
 * @property {Arg[]} args
 *
 * @typedef {object} Arg
 * @property {any} value
 * @property {string} type
 */

/**
 * Translates a path returned by groupArgs to a GraphQL selections array.
 *
 * @param {ArgAwarePath} path
 * @returns {object[]} a GraphQL selections array; pass it to wrapInQuery to make a full GraphQL query
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
    // GraphQL does not like empty nodes. It will error out on them when printing.
    // We have to strip empty nodes.
    if (_.isEmpty(gqlNode.arguments)) delete gqlNode.arguments
    if (_.isEmpty(gqlNode.selectionSet.selections)) delete gqlNode.selectionSet
    return gqlNode
  })
}

/**
 * Groups fields with their arguments. Uses the GraphQL schema to detect arguments.
 *
 * @param {FalcorPath} path falcor path
 * @param {string} type a type from the GraphQL schema which the path is relative to; the first segment of the path should be a field name from this type
 * @param {GraphQLSchema=} schema GraphQL schema returned by getSchema; if undefined, all path segments are assumed to be fields
 * @returns {ArgAwarePath}
 */
export function groupArgs (path, type, schema) {
  const pathWithRangesAsArgs = _.flatMap(path, segment => _.isPlainObject(segment) ? rangeToArgs(segment) : [segment])
  return actuallyGroupArgs(pathWithRangesAsArgs, type, schema)

  /**
   * Transforms a Falcor range object to an array of 4 elements so it looks like 2 argument pairs.
   */
  function rangeToArgs ({from = 0, to = 1, length}) {
    if (!length) length = to - from + 1
    return ['from', from, 'length', length]
  }

  function actuallyGroupArgs (path, type, schema) {
    // This function is recursive and one pass of it only moves forward one field into the model.
    // It attempts to capture the field (which name is the first segment of the given path) and its arguments (if there are any).
    // As soon as it encounters a path segment that is not an argument to the first field, it assumes it is the next field down the model and recurses.
    if (path.length === 0) return []
    // We are sure the first segment is a field into the given type (that's the function contract).
    // Everything after that might be arguments to this field, or that might be other fields.
    // We have to scan the segments until we find the first segment that is not an argument name (according to the schema).
    const [field, ...maybeArgs] = path
    const fieldSchema = schema && schema.getType(type).getFields()[field] || {args: {}, type: {name: type}}
    const args = _(maybeArgs)
      .chunk(2)
      .takeWhile(([name]) => _.some(fieldSchema.args, {name}))
      .fromPairs()
      .mapValues((value, name) => ({value: _.isNil(value) ? '' : value, type: typeOf(_.find(fieldSchema.args, {name}))}))
      .value()
    // So now we have the arguments but we have lost the information of how many segments they take up in the original path.
    // We have to re-compute this to strip those segment from the original path and continue to process the rest of the path.
    const numberOfPathSegmentTakenByArgs = Object.keys(args).length * 2
    const restOfPath = _.drop(maybeArgs, numberOfPathSegmentTakenByArgs)
    const typeOfRestOfPath = typeOf(fieldSchema)
    return [{field, args}, ...groupArgs(restOfPath, typeOfRestOfPath, schema)]

    function typeOf ({type}) {
      return getNamedType(type).name
    }
  }
}

function getSchema () {
  if (getSchema.schema) return getSchema.schema
  getSchema.schema = fetch('http://127.0.0.1:7080/graphql', {
    method: 'post',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({query: introspectionQuery})
  })
  .then(response => response.json())
  .then(response => buildClientSchema(response.data))
  return getSchema.schema
}
