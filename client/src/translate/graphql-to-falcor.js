import {parse} from "graphql/language/parser"
import _ from "lodash"

export default function translate(inputGraphQl) {
  const parsedGraphQl = parse(inputGraphQl)

  function translateNode(node) {
    switch (node.kind) {
      case 'Document': return translateNode(node.definitions[0])
      case 'OperationDefinition': return translateNode(node.selectionSet)
      case 'Field': return visitField(node)
      case 'SelectionSet': return _.flatMap(node.selections, translateNode)
      default: throw new Error('unknown kind: ' + node.kind)
    }

    function visitField(node) {
      const subtree = node.selectionSet ? translateNode(node.selectionSet) : [[]]
      const range = buildRange(node.arguments)
      const args = _.flatMap(node.arguments, arg => [arg.name.value, arg.value.value])
      return _.map(subtree, path => [node.name.value, ...args, ...range, ...path])
    }

    function buildRange(args) {
      const [fromArg] = _.remove(args, {name: {value: 'from'}})
      const [lengthArg] = _.remove(args, {name: {value: 'length'}})
      if (!fromArg && !lengthArg) return []
      const range = {}
      if (fromArg) range.from = Number(fromArg.value.value)
      if (lengthArg) range.length = Number(lengthArg.value.value)
      return [range]
    }
  }

  return translateNode(parsedGraphQl)
}
