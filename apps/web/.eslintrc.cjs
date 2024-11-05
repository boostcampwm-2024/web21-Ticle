const path = require('path');

const baseConfig = path.resolve(__dirname, 'tsconfig.json');
const appConfig = path.resolve(__dirname, 'tsconfig.app.json');
const nodeConfig = path.resolve(__dirname, 'tsconfig.node.json');

/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: [require.resolve('@repo/lint'), 'plugin:react-hooks/recommended'],
  plugins: ['react-refresh'],
  settings: {
    react: {
      version: '18.3.0',
    },
    'import/resolver': {
      typescript: {
        project: [baseConfig, appConfig, nodeConfig],
        node: {
          paths: ['src'],
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
  },
  parserOptions: {
    project: [baseConfig, appConfig, nodeConfig],
  },
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'import/no-unresolved': ['error', { ignore: ['^/'] }],
  },
};