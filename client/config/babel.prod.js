module.exports = {
  presets: [
    'babel-preset-react'
  ].map(require.resolve),
  plugins: [
    'babel-plugin-transform-react-constant-elements',
    'babel-plugin-transform-es2015-modules-commonjs'
  ].map(require.resolve)
};
