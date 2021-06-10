module.exports = {
  modulePaths: [
    '<rootDir>/src/',
    '<rootDir>/node_modules'
  ],
  transform: {
    '^.+\\.(ts)$': 'ts-jest'
  },
  setupFiles: [
    '<rootDir>/tests/jest-setup.config.ts'
  ],
};
