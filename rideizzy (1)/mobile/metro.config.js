const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Newer Metro versions enable "package exports" resolution by default,
// which conflicts with how react-native-web expects to be resolved for
// internal React Native modules (like ReactNativePrivateInterface.js).
// Disabling it fixes "Unable to resolve ../Utilities/Platform" errors.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;