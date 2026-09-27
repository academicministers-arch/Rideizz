const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Newer Metro versions enable "package exports" resolution by default,
// which conflicts with how react-native-web expects to be resolved for
// internal React Native modules (like ReactNativePrivateInterface.js).
config.resolver.unstable_enablePackageExports = false;

// Explicitly prioritize react-native/browser fields so Metro picks the
// web-compatible version of internal modules instead of native-only ones.
config.resolver.resolverMainFields = ["react-native", "browser", "main"];

module.exports = config;