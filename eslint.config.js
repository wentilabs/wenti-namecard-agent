module.exports = [
  {
    ignores: ['node_modules', 'dist', 'build', '.next', 'coverage'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script', // <-- Use 'script' for CommonJS
      globals: {
        React: 'readonly',
      },
    },
    plugins: {
      prettier: require('eslint-plugin-prettier'),
    },
    rules: {
      // General JS/ES6+ rules
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // 'no-console': 'warn',
      'arrow-body-style': ['error', 'as-needed'],
      'object-shorthand': ['error', 'always'],
      // 'prefer-template': 'error',
      'prettier/prettier': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
