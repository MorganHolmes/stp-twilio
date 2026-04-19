module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverage: true,
  collectCoverageFrom: ["src//*.ts", "!/*.d.ts"],
  coveragePathIgnorePatterns: ["mock"],
  coverageReporters: ["lcov", "text"],
  };