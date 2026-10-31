import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import nodePlugin from 'eslint-plugin-n';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    name: 'ignore files',
    ignores: ['reports/', 'data/', 'build/']
  },
  {
    name: 'include files',
    files: ['**/*.{js,mjs,cjs,ts}']
  },
  {
    name: 'globals for node',
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: { globals: globals.node }
  },
  {
    ...pluginJs.configs.recommended,
    name: 'plugin-js recommended'
  },
  {
    ...nodePlugin.configs['flat/recommended-module'],
    name: 'custom eslint-plugin-n plugin config',
    files: ['**/*.{js,ts}'],
    rules: {
      'n/no-process-env': 'error',
      'n/no-missing-import': [
        'off', // eslint-plugin-n fails to resolve index.ts files
        {
          tryExtensions: ['.ts', '.d.ts']
        }
      ],
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ]
    },
    languageOptions: {
      globals: {
        ...globals.node,
        NodeJS: true
      }
    }
  },
  {
    ...nodePlugin.configs['flat/recommended-module'],
    name: 'custom eslint-plugin-n plugin config for tests',
    files: ['tests*/**/*.{js,ts}'],
    // eslint-plugin-n rules
    rules: {
      'n/no-process-env': 'off'
    },
    languageOptions: {
      globals: {
        ...globals.mocha
      }
    }
  },
  {
    // eslint core rules
    rules: {
      complexity: ['warn', 12],
      'no-console': 'error',
      eqeqeq: ['error', 'smart']
    }
  },
  pluginPrettierRecommended
];
