import { Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, Defs, Pattern, Rect } from "react-native-svg";
import { useRouter } from "expo-router";
import { Btn, ThemeProvider, Wordmark, useTheme } from "@jokko/ui-mobile";

/**
 * First-run welcome — the editorial dark hero from the design bundle
 * (`v2/screens-onboarding.jsx` · ScrWelcome). Funnels into the auth stack;
 * the actual provider auth lives on the sign-up screen.
 */
export function WelcomeScreen() {
  return (
    <ThemeProvider dark>
      <WelcomeInner />
    </ThemeProvider>
  );
}

function WelcomeInner() {
  const router = useRouter();
  const { colors, font } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.paper }]}>
      <StatusBar style="light" />
      <DotField color="rgba(242,239,232,0.06)" />

      {/* Brand */}
      <View style={styles.brand}>
        <Wordmark size={26} />
        <Text style={[styles.eyebrow, { color: colors.mute, fontFamily: font.monoMedium }]}>
          WHATSAPP BUSINESS · ÉQUIPES
        </Text>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={[styles.heroTitle, { color: colors.ink, fontFamily: font.display }]}>
          La messagerie{"\n"}
          <Text style={{ fontFamily: font.displayItalic, color: colors.accent }}>client</Text>,{"\n"}
          faite équipe.
        </Text>
        <Text style={[styles.heroSub, { color: colors.ink3, fontFamily: font.sans }]}>
          Centralisez vos conversations WhatsApp, répondez en équipe, sans jamais rater un message.
        </Text>
      </View>

      {/* CTAs */}
      <View style={styles.ctas}>
        <Btn
          tone="accent"
          size="lg"
          full
          iconRight="arrow-right"
          onPress={() => router.push("/auth/sign-up")}
        >
          Continuer avec l'e-mail
        </Btn>
        <View style={styles.providerRow}>
          <Btn tone="ghost" size="lg" full style={styles.providerBtn} onPress={() => router.push("/auth/sign-up")}>
            <View style={styles.providerInner}>
              <Ionicons name="logo-apple" size={18} color={colors.ink} />
              <Text style={[styles.providerLabel, { color: colors.ink, fontFamily: font.sansMedium }]}>Apple</Text>
            </View>
          </Btn>
          <Btn tone="ghost" size="lg" full style={styles.providerBtn} onPress={() => router.push("/auth/sign-up")}>
            <View style={styles.providerInner}>
              <Ionicons name="logo-google" size={17} color={colors.ink} />
              <Text style={[styles.providerLabel, { color: colors.ink, fontFamily: font.sansMedium }]}>Google</Text>
            </View>
          </Btn>
        </View>
        <View style={styles.signinRow}>
          <Text style={[styles.signinPrompt, { color: colors.mute, fontFamily: font.sans }]}>
            Vous avez déjà un compte ?{" "}
          </Text>
          <Pressable onPress={() => router.push("/auth/sign-in")} hitSlop={6}>
            <Text style={[styles.signinCta, { color: colors.accent2, fontFamily: font.sansMedium }]}>Se connecter</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function DotField({ color }: { color: string }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="dots" width={24} height={24} patternUnits="userSpaceOnUse">
            <Circle cx={1.4} cy={1.4} r={1.4} fill={color} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#dots)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  brand: { paddingHorizontal: 28, paddingTop: 32 },
  eyebrow: { marginTop: 12, fontSize: 10.5, letterSpacing: 0.85 },
  hero: { flex: 1, paddingHorizontal: 28, justifyContent: "center" },
  heroTitle: { fontSize: 60, lineHeight: 58, letterSpacing: -1.5 },
  heroSub: { fontSize: 16, lineHeight: 23, marginTop: 22, maxWidth: 290 },
  ctas: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20, gap: 10 },
  providerRow: { flexDirection: "row", gap: 10 },
  providerBtn: { flex: 1, justifyContent: "center" },
  providerInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  providerLabel: { fontSize: 15 },
  signinRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 8 },
  signinPrompt: { fontSize: 13 },
  signinCta: { fontSize: 13 },
});
