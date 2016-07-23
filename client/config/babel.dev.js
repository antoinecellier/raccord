module.exports = {
  cacheDirectory: true,
  presets: [
    'babel-preset-react'
  ].map(require.resolve),
  plugins: [
    'babel-plugin-transform-es2015-modules-commonjs'
  ].map(require.resolve)
};
