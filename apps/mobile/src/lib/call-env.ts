import Constants, { ExecutionEnvironment } from "expo-constants";

/**
 * `react-native-webrtc` is a native module that is NOT bundled in Expo Go.
 * Audio calls only work in a custom dev/standalone build (after `expo prebuild`).
 * Gate the whole call subsystem on this so Expo Go keeps running everything else,
 * and the call button shows a clear "build natif requis" message instead of
 * silently creating a call nothing can answer.
 */
export const callsAvailable = Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
