const arangojs = require('arangojs')
const indices = require('./indices')

module.exports = () => {
  console.log('creating indices')
  Promise.all(indices.map(index => {
    if(index.geo)
      return arangojs()
        .collection(index.collection)
        .createGeoIndex(index.geo)

    return arangojs()
      .collection(index.collection)
      .createIndex(index)
  })).then(() => console.log('done'))
}

if (require.main === module) module.exports()
