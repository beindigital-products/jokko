const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// pnpm monorepo: forcer Metro à utiliser uniquement les nodeModulesPaths
// configurés ci-dessus. Sinon Metro trouve la copie root node_modules/react-native
// (real dir) ET le symlink apps/mobile/node_modules/react-native (→ .pnpm/...) →
// imports internes de react-native cassent (ex. "Cannot resolve InputAccessoryView").
// Recommandation officielle Expo en monorepo pnpm.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
