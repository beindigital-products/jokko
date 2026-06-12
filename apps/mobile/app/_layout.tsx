import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import {
  JetBrainsMono_500Medium,
  JetBrainsMono_500Medium_Italic,
} from "@expo-google-fonts/jetbrains-mono";
import {
  Geist_300Light,
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
} from "@expo-google-fonts/geist";
import { GeistMono_400Regular, GeistMono_500Medium } from "@expo-google-fonts/geist-mono";
import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from "@expo-google-fonts/instrument-serif";
import { theme } from "@jokko/tokens";
import { MobileAppProviders } from "../src/MobileAppProviders";

export default function RootLayout() {
  // v2 design fonts — JetBrains Mono (display) + Geist (sans/mono) + Instrument
  // Serif (editorial italic). Gate render until loaded so text never flashes in
  // a fallback face. The family keys here MUST match `fontFamily` in @jokko/tokens.
  const [fontsLoaded, fontError] = useFonts({
    JetBrainsMono_500Medium,
    JetBrainsMono_500Medium_Italic,
    Geist_300Light,
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    GeistMono_400Regular,
    GeistMono_500Medium,
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
  });

  if (!fontsLoaded && !fontError) {
    return <View style={styles.root} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <MobileAppProviders>
          {/* Edge-to-edge: each screen paints its own background to all four
              edges and applies safe-area insets via the <Screen> primitive, so
              dark/full-bleed screens never show white safe-area bands. */}
          <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.paper.white },
              }}
            />
          </KeyboardAvoidingView>
        </MobileAppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.paper.white },
});
