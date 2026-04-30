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
// pnpm monorepo: hierarchical lookup DOIT rester actif (false) pour que
// Metro trouve les deps transitives dans .pnpm/<pkg>@<version>/node_modules/.
// Exemple : `expo` importe `expo-modules-core`, qui n'est pas hoisté à la
// racine ni dans apps/mobile/node_modules — il vit dans
// .pnpm/expo@54.../node_modules/expo-modules-core/ et seul le walk-up le
// trouve. Désactiver casse "Unable to resolve expo-modules-core from expo".
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
