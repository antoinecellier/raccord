'use strict'

const fs = require('fs')
const path = require('path')
const csvStream = require('csv-stream')
const jsonStream = require('JSONStream')
const request = require('request-promise')

const sourceDir = __dirname
const destDb = process.argv[2] || 'http://localhost:8529/_db/_system'

fs.readdirSync(sourceDir)
  .map(fileName => path.join(sourceDir, fileName))
  .filter(filePath => path.extname(filePath) === '.txt')
  .map(csvFilePath => [csvFilePath, path.join(sourceDir, path.basename(csvFilePath, '.txt') + '.json')])
  .map(([csvFilePath, jsonFilePath]) => [jsonFilePath, convert(csvFilePath, jsonFilePath)])
  .forEach(([jsonFilePath, stream]) => stream.on('finish', () => importInto(path.basename(jsonFilePath, '.json'), jsonFilePath)))

function convert (pathIn, pathOut) {
  console.log('converting:', path.basename(pathIn), '=>', path.basename(pathOut))
  return fs.createReadStream(pathIn)
    .pipe(csvStream.createStream({delimiter: ',', enclosedChar: '"'}))
    .pipe(jsonStream.stringify('[\n', ',\n', '\n]\n'))
    .pipe(fs.createWriteStream(pathOut))
}

function importInto (collection, jsonFilePath) {
  console.log('importing into new collection:', path.basename(jsonFilePath), '=>', collection)
  const documents = require(jsonFilePath)
  request.delete(`${destDb}/_api/collection/${collection}`)
    .catch(() => {}) // in case the collection does not exist
    .then(() => request.post(`${destDb}/_api/collection`, {body: {name: collection}, json: true}))
    .then(() => request.post(`${destDb}/_api/import?collection=${collection}&type=list`, {body: documents, json: true}))
    .then(() => console.log('done:', collection))
}
