const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration for Tides mobile app
 * 
 * IMPORTANT: Keep this configuration standard to avoid symlink issues
 * This app is intentionally isolated from the monorepo workspace
 * to ensure Metro bundler compatibility.
 * 
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
