import resolve from '@rollup/plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';

export default {
  input: 'base.js',
  output: {
    file: 'dist/bundle.js',
    format: 'cjs'
  },
  plugins: [ 
    resolve(),
    babel({ 
      exclude: 'node_modules/**',
      presets: ['@babel/env', '@babel/preset-react']
    }),
    commonjs()
  ],
  external: [
    'lodash',
    'lodash/debounce',
    'lodash/isEqual',
    'lodash/flattenDeep',
    'react',
    'react-context-filter',
    'react-animate-height',
    'react-custom-renderer',
    'yup',
    'yup-extensions'
  ]
};