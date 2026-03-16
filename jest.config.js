module.exports = {
    testEnvironment: 'node',
    testMatch: [
        '**/tests/**/*.test.js'
    ],
    collectCoverageFrom: [
        'src/main/services/**/*.js',
        '!src/main/services/**/*.test.js'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    modulePathIgnorePatterns: [
        '<rootDir>/node_modules/'
    ],
    testTimeout: 10000
};
