module.exports = {
  testEnvironment: "jsdom",
  collectCoverage: true,
  collectCoverageFrom: [
    "app/services/api.ts",
    "store/useUserStore.tsx",
    "schema/notification.ts",
    "store/notiStore.tsx",
    "components/figma/ImageWithFallback.tsx",
    "styles/theme.ts",
    "utils/date.ts",
    "utils/text.ts",
  ],
  coverageReporters: ["json", "lcov", "text", "clover", "html"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
        },
        isolatedModules: true,
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    // Stub RN/Expo modules used in core files
    "^expo-secure-store$": "<rootDir>/test-stubs/expo-secure-store.js",
    "^@react-native-async-storage/async-storage$": "<rootDir>/test-stubs/async-storage.js",
  },
  // Allow component tests (web) to run in jsdom
};