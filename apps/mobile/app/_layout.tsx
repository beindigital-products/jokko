import { KeyboardAvoidingView, Platform, StatusBar, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@jokko/tokens";
import { MobileAppProviders } from "../src/MobileAppProviders";

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={styles.root}>
            <SafeAreaProvider>
                <MobileAppProviders>
                    <KeyboardAvoidingView
                        style={styles.root}
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                    >
                        <SafeAreaView style={styles.root}>
                            <StatusBar barStyle="dark-content" />
                            <Stack
                                screenOptions={{
                                    headerShown: false,
                                    contentStyle: { backgroundColor: theme.surface.default },
                                }}
                            />
                        </SafeAreaView>
                    </KeyboardAvoidingView>
                </MobileAppProviders>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.surface.default },
});
