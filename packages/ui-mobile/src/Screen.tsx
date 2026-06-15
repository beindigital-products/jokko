import { type ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@jokko/tokens";
import { useTheme } from "./theme";

/**
 * Full-bleed screen surface. The screen's background must reach every edge
 * (including the notch + home-indicator safe areas) — otherwise dark screens
 * show white bands where a parent's background peeks through.
 *
 * Two modes:
 *  - non-bleed (default): for an edge-to-edge root (no parent SafeAreaView) —
 *    paints the background full-bleed AND insets the content here. This is the
 *    correct mode: a native-stack screen is clipped to the navigator's content
 *    box, so a parent SafeAreaView would crop any overflow trick anyway.
 *  - `bleed`: only when a parent already inset us — repaints the margin regions
 *    with this screen's background via an absolute layer past the insets.
 */
export function Screen({
  children,
  dark,
  bleed = false,
  color,
  style,
}: {
  children: ReactNode;
  dark?: boolean;
  bleed?: boolean;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme(dark);
  const insets = useSafeAreaInsets();
  const bg = color ?? colors.paper;

  if (bleed) {
    return (
      <View style={[{ flex: 1 }, style]}>
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: -insets.top,
            bottom: -insets.bottom,
            left: 0,
            right: 0,
            backgroundColor: bg,
          }}
        />
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        { flex: 1, backgroundColor: bg, paddingTop: insets.top, paddingBottom: insets.bottom },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * Safe-area wrapper for screens not yet rebuilt on the v2 design — they still use
 * the legacy warm surface (`theme.surface.default`). Paints that exact background
 * to all four edges so it fills the whole screen, while insetting the content past
 * the notch. Swap for a plain `<Screen>` once a screen is migrated to v2.
 */
export function LegacyScreen({ children }: { children: ReactNode }) {
  return <Screen color={theme.surface.default}>{children}</Screen>;
}
