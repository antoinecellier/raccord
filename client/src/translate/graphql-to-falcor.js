import {parse} from "graphql/language/parser"
import _ from "lodash"

export default function translate(inputGraphQl) {
  const parsedGraphQl = parse(inputGraphQl)
  let falcor = []
  _.cloneDeepWith(parsedGraphQl, value => {
    if (_.get(value, "kind") === "SelectionSet") {
      const currentPath = falcor.shift() || []
      falcor = falcor.concat(_.map(value.selections, selection => {
        const newSegment = [selection.name.value]
        if (selection.arguments) _.each(selection.arguments, arg => newSegment.push(arg.value.value))
        return currentPath.concat(newSegment)
      }).reverse())
    }
  })
  return falcor
}
