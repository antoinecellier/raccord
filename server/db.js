import arangojs from 'arangojs'

export default function getConnection () {
  getConnection.connection = getConnection.connection || arangojs()
  return getConnection.connection
}

export const aql = arangojs.aql
