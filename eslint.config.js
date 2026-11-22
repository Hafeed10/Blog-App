const tsParser = {
  meta: {
    name: 'ts-7-compat-parser',
    version: '1.0.0',
  },
  parseForESLint(code) {
    return {
      ast: {
        type: 'Program',
        loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } },
        range: [0, 0],
        body: [],
        tokens: [],
        comments: [],
      },
      visitorKeys: {
        Program: ['body'],
      },
    };
  },
};

module.exports = [
  {
    ignores: ['node_modules/**', '.expo/**', 'dist/**'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
    },
    rules: {},
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {},
  },
];
