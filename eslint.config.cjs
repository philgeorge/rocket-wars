// ESLint flat config for Rocket Wars
const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  // Lint this config file (and root node scripts) with Node globals
  {
    files: ['eslint.config.cjs', 'update-version.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly',
        process: 'readonly',
        __dirname: 'readonly'
      }
    },
    rules: {
      indent: ['warn', 4, { SwitchCase: 1 }]
    }
  },
  {
    files: ['src/**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
  Phaser: 'readonly',
  // Browser/timer APIs used in code
  navigator: 'readonly',
  localStorage: 'readonly',
  Event: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { args: 'after-used', argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'prefer-const': ['warn', { destructuring: 'all' }],
      'no-var': 'warn',
      'eqeqeq': ['warn', 'always'],
      'curly': ['warn', 'multi-line'],
      // Enforce 4-space indentation per project preference
      'indent': ['warn', 4, { SwitchCase: 1 }]
    }
  }
];
