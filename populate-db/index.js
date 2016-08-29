const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')
const createIndices = require('./create-indices')

if (!process.env.ARANGODB_HOME) {
  console.error('ARANGODB_HOME is not defined. Please set ARANGODB_HOME to the installation directory of ArangoDB')
  process.exit()
}

const sourceDir = process.argv[2] || '.'
const arangoimpAdditionalArgs = process.argv.slice(3)
const arangoimpPath = path.join(process.env.ARANGODB_HOME, 'bin', 'arangoimp')


const arangoimpDefaultArgs = filePath => [
  '--file', filePath,
  '--type', 'csv',
  '--collection', path.basename(filePath, '.txt'),
  '--create-collection', 'true',
  '--overwrite',
  '--server.password', '""']

const files = fs.readdirSync(sourceDir)
  .map(fileName => path.join(sourceDir, fileName))
  .filter(filePath => path.extname(filePath) === '.txt')

console.log(`importing ${files.length} files`)

files.forEach(filePath => childProcess.execFileSync(
  arangoimpPath,
  [...arangoimpDefaultArgs(filePath), ...arangoimpAdditionalArgs],
  {stdio: ['ignore', 'ignore', 'pipe']}))

console.log('done')

createIndices()
