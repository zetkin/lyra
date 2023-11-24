module.exports = {
  extends: 'next/core-web-vitals',
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        'quotes': ['error', 'single', { 'avoidEscape': true }],
        'indent': ['error', 2],
      },
    },
  ],
};
