module.exports = {
  env: {
    browser: false,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Error prevention
    'no-console': 'off', // Allow console.log in CLI tools
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-undef': 'error',
    'no-unreachable': 'error',
    
    // Code style
    'indent': ['error', 2],
    'linebreak-style': 'off', // Allow both Unix and Windows line endings
    'quotes': ['error', 'single', { 'allowTemplateLiterals': true }],
    'semi': ['error', 'always'],
    
    // Best practices
    'eqeqeq': ['error', 'always'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // Node.js specific
    'no-process-exit': 'off', // Allow process.exit in CLI tools
    'no-sync': 'off', // Allow sync methods in CLI tools
    
    // Async/await
    'require-await': 'error',
    'no-async-promise-executor': 'error',
    
    // Error handling
    'handle-callback-err': 'error',
    'no-throw-literal': 'error'
  },
  globals: {
    // Node.js globals
    'process': 'readonly',
    'Buffer': 'readonly',
    '__dirname': 'readonly',
    '__filename': 'readonly',
    'global': 'readonly',
    'module': 'readonly',
    'require': 'readonly',
    'exports': 'readonly',
    'console': 'readonly'
  },
  overrides: [
    {
      files: ['test/**/*.js', '*.test.js', '*.spec.js'],
      env: {
        jest: true
      },
      rules: {
        'no-unused-expressions': 'off'
      }
    }
  ]
};
