import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Top-level crash guard. A render error anywhere below would otherwise white-screen
 * the whole app (no native crash dialog in a release build). This catches it and
 * shows a recoverable fallback. Deliberately self-contained — hardcoded colors and
 * the system font — so it still renders even if the theme/fonts/providers are what
 * failed (e.g. a duplicate-React "useMemo of null").
 */
export class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        // Message + component stack only — never log conversation data here.
        console.error("[ErrorBoundary]", error?.message, info?.componentStack);
    }

    reset = () => this.setState({ error: null });

    render() {
        if (this.state.error) {
            return (
                <View style={styles.root}>
                    <Text style={styles.mark}>Jokko</Text>
                    <Text style={styles.title}>Oups, quelque chose a planté.</Text>
                    <Text style={styles.body}>
                        L'app a rencontré une erreur inattendue. Réessaie, ou redémarre l'application si le problème
                        persiste.
                    </Text>
                    <Pressable
                        accessibilityRole="button"
                        onPress={this.reset}
                        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
                    >
                        <Text style={styles.buttonText}>Réessayer</Text>
                    </Pressable>
                </View>
            );
        }
        return this.props.children;
    }
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
        backgroundColor: "#0A0A0A",
    },
    mark: { fontSize: 18, fontWeight: "600", fontStyle: "italic", color: "#F2EFE8", marginBottom: 28 },
    title: { fontSize: 20, fontWeight: "700", color: "#F2EFE8", textAlign: "center" },
    body: {
        marginTop: 10,
        fontSize: 14,
        lineHeight: 20,
        color: "rgba(242,239,232,0.6)",
        textAlign: "center",
        maxWidth: 300,
    },
    button: {
        marginTop: 28,
        height: 50,
        paddingHorizontal: 28,
        borderRadius: 14,
        backgroundColor: "#6938EF",
        alignItems: "center",
        justifyContent: "center",
    },
    buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
    pressed: { opacity: 0.8 },
});
