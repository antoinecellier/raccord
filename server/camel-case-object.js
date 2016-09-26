// import camelCase from 'lodash/camelCase'

// export default function camelCaseObject (obj) {
//   if (typeof obj !== 'object') return obj
//   return mapKeyValues(obj, camelCase, camelCaseObject)
// }

// function mapKeyValues (obj, keyMapper, valueMapper) {
//   const result = {}
//   for (const key in obj) {
//     if (Object.hasOwnProperty(obj, key)) {
//       const value = obj[key]
//       const newKey = keyMapper(key, value, obj)
//       const newValue = valueMapper(value, key, obj)
//       result[newKey] = newValue
//     }
//   }
//   return result
// }

import {camelCase, flow, mapKeys, mapValues} from 'lodash'

const toDto = flow(
  camelCaseKeysDeep,
  mapKeys(removePrefix('stop')),
  set('id', stopBusinessId)
)

const camelCaseKeysDeep = flow(
  mapKeys(camelCase),
  mapValues(camelCaseObject)
)

const camelCaseObject = obj => typeof obj === 'object' ? camelCaseKeysDeep(obj) : obj

const removePrefix = prefix => str => str.replace()
