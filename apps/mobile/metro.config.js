const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = {
    watchFolders: [monorepoRoot],
    resolver: {
        nodeModulesPaths: [
            path.resolve(projectRoot, 'node_modules'),
            path.resolve(monorepoRoot, 'node_modules'),
        ],
        // disableHierarchicalLookup: true,
        unstable_enableSymlinks: true,
        unstable_enablePackageExports: true,
    },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
