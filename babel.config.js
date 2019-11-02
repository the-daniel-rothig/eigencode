module.exports = function (api) {
  api.cache(true);

  const presets = [ '@babel/env', 'react-app' ];
  const plugins = [  ];

  return {
    presets,
    plugins
  };
}