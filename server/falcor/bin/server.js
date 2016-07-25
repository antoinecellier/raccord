const fs = require('fs');

const babelConfig = JSON.parse(fs.readFileSync('./.babelrc'));
const serverConfig = require('../../config');

require('babel-core/register')(babelConfig);
const falcorServer = require('../server').default;
falcorServer(serverConfig.falcor.port);
