// Jest config for frontend: supports Node.js and React
module.exports = {
	// Use jsdom for React, node for Node.js code
	testEnvironment: 'jsdom', // Use jsdom for React/component tests
	moduleFileExtensions: ['js', 'jsx'],
	transform: {
		'^.+\\.(js|jsx)$': 'babel-jest',
	},
	setupFilesAfterEnv: ['@testing-library/jest-dom'],
	moduleNameMapper: {
		'\\.(css|less|scss|sass)$': 'identity-obj-proxy',
		'^.+src/config/index.js$': '<rootDir>/tests/__mocks__/config.js',
		'^.+src/config$': '<rootDir>/tests/__mocks__/config.js',
	},
	// Match both .jest.test.js and .test.js/.test.jsx files
	testMatch: [
		'**/tests/**/*.jest.test.js',
		'**/tests/**/*.test.js',
		'**/tests/**/*.test.jsx',
	],
	testPathIgnorePatterns: ['/node_modules/'],
	// Collect coverage from all src JS/JSX files
	collectCoverageFrom: ['src/**/*.js', 'src/**/*.jsx'],
};
