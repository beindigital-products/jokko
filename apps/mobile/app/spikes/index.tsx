import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { theme } from "@jokko/tokens";
import type { TranslationKey } from "@jokko/i18n";

type SpikeRoute = "/onboarding" | "/spikes/glass-reply" | "/spikes/inbox-breathing" | "/spikes/compose-morph" | "/spikes/apple-signin" | "/spikes/voice-waveform";

const menuItems: ReadonlyArray<{
    route: SpikeRoute;
    label: TranslationKey;
    hint: TranslationKey;
}> = [
    { route: "/onboarding", label: "spikes.onboarding", hint: "spikes.onboardingHint" },
    { route: "/spikes/glass-reply", label: "spikes.glassReply", hint: "spikes.glassReplyHint" },
    { route: "/spikes/inbox-breathing", label: "spikes.inboxBreathing", hint: "spikes.inboxBreathingHint" },
    { route: "/spikes/compose-morph", label: "spikes.composeMorph", hint: "spikes.composeMorphHint" },
    { route: "/spikes/apple-signin", label: "spikes.apple", hint: "spikes.appleHint" },
    { route: "/spikes/voice-waveform", label: "spikes.voice", hint: "spikes.voiceHint" },
];

export default function SpikesRoute() {
    const router = useRouter();
    const { t } = useTranslation();

    return (
        <View style={styles.menu}>
            <Text style={styles.title}>{t("spikes.title")}</Text>
            <Text style={styles.subtitle}>{t("spikes.subtitle")}</Text>
            {menuItems.map((item) => (
                <MenuButton
                    key={item.route}
                    label={t(item.label)}
                    hint={t(item.hint)}
                    onPress={() => router.push(item.route)}
                />
            ))}
        </View>
    );
}

function MenuButton({ label, hint, onPress }: { label: string; hint: string; onPress: () => void }) {
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [styles.menuBtn, pressed && styles.pressed]}>
            <Text style={styles.menuBtnLabel}>{label}</Text>
            <Text style={styles.menuBtnHint}>{hint}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    menu: { flex: 1, padding: theme.spacing.xl, justifyContent: "center", backgroundColor: theme.surface.default },
    title: { fontSize: 28, fontWeight: "700", color: theme.ink[900], marginBottom: theme.spacing.sm },
    subtitle: { fontSize: 15, color: theme.ink[500], marginBottom: theme.spacing.xxl, lineHeight: 22 },
    menuBtn: {
        backgroundColor: theme.surface.raised,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.ink[300],
    },
    menuBtnLabel: { fontSize: 16, fontWeight: "600", color: theme.ink[900], marginBottom: 2 },
    menuBtnHint: { fontSize: 13, color: theme.ink[500] },
    pressed: { opacity: 0.6 },
});
