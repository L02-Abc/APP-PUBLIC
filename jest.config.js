module.exports = {
  preset: "jest-expo",
  collectCoverage: true,
  collectCoverageFrom: [
    "**/*.{ts,tsx}",
    "!**/coverage/**",
    "!**/node_modules/**",
    "!**/babel.config.js",
    "!**/jest.setup.js"
  ],
  coverageReporters: ["json", "lcov", "text", "clover", "html"], // "html" tạo ra index.html
  setupFilesAfterEnv: ["@testing-library/jest-native/extend-expect"], // Optional: Giúp test dễ viết hơn
  transformIgnorePatterns: [
    "node_modules/(?!react-native|expo|@expo|@react-native|@react-navigation)"
  ],
};