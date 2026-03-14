module.exports = {
  testEnvironment: "node",
  testMatch: ["**/*.jest.test.js"],
  testPathIgnorePatterns: ["/node_modules/"],
  collectCoverageFrom: ["src/**/*.js"],
};
