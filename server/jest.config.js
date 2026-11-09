module.exports = {
  testEnvironment: 'node',

  // Recognise our test files.
  testMatch: ['**/test/**/*.test.js'],

  // Run tests sequentially to avoid shared database conflicts.
  maxWorkers: 1,

  clearMocks: true,
  restoreMocks: true,
};