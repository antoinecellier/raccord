var fs = require('fs');

var babelrc = fs.readFileSync('./.babelrc');
var serverConfig = fs.readFileSync('../config.json');
var babelConfig, falcorServerConfig;

try {
  babelConfig = JSON.parse(babelrc);
} catch (err) {
  console.error('==>     ERROR: Error parsing your .babelrc.');
  console.error(err);
}

try {
  falcorServerConfig = JSON.parse(serverConfig);
} catch (err) {
  console.error('==>     ERROR: Error parsing your config.json .');
  console.error(err);
}

require('babel-core/register')(babelConfig);
var FalcorServer = require('../server').FalcorServer;
new FalcorServer(falcorServerConfig.falcor.port)
