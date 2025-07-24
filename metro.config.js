const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
    server: {
        port: 8081,
    },
    // Added to ensure better error reporting and reconnection
    watchFolders: [__dirname],
    maxWorkers: 2,
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
