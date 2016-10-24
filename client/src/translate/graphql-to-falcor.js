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
        if (selection.arguments) {
          const [fromArg] = _.remove(selection.arguments, {name: {value: "from"}})
          const [lengthArg] = _.remove(selection.arguments, {name: {value: "length"}})
          _.each(selection.arguments, arg => newSegment.push(arg.name.value, arg.value.value))
          if (fromArg || lengthArg) newSegment.push({from: fromArg.value.value, length: lengthArg.value.value})
        }
        return currentPath.concat(newSegment)
      }).reverse())
    }
  })
  return falcor
}
