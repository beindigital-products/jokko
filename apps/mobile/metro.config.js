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

// Force a SINGLE React instance into the mobile bundle. This pnpm monorepo also
// holds react@19.2.0 (the web app pins it; mobile/Expo 54 pins 19.1.0). Shared
// deps such as @convex-dev/auth exist in two peer-resolved copies and can pull
// the 19.2.0 React alongside the app's 19.1.0 → two Reacts in one bundle →
// "Cannot read property 'useMemo' of null". Redirect every `react`/`react/*`
// import to apps/mobile's 19.1.0 so React (incl. react-native's renderer) is
// one object. Touches the mobile bundle only — the web build is unaffected.
const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react' || moduleName.startsWith('react/')) {
    try {
      return {
        type: 'sourceFile',
        filePath: require.resolve(path.join(projectRoot, 'node_modules', moduleName)),
      };
    } catch {
      // Fall through to default resolution if the subpath isn't found locally.
    }
  }
  return upstreamResolveRequest
    ? upstreamResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
