module.exports = function (api) {
  const isTest = api.env("test");
  // Avoid conflicting cache configuration when using api.env
  api.cache(!isTest);
  return {
    presets: isTest
      ? [
          // Use metro RN preset for tests to avoid Expo auto-including Reanimated plugin
          "module:metro-react-native-babel-preset",
        ]
      : [
          ["babel-preset-expo", { jsxImportSource: "nativewind" }],
          "nativewind/babel",
        ],
    // Disable Reanimated plugin in test environment to avoid RN worklets dependency issues
    plugins: isTest
      ? []
      : [
          // Reanimated must be listed LAST
          "react-native-reanimated/plugin",
        ],
  };
};