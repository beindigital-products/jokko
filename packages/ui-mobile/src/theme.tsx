import { createContext, useContext, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import {
  fontFamily,
  v2Dark,
  v2Light,
  v2Radius,
  type FontFamily,
  type V2Palette,
  type V2Radius,
} from "@jokko/tokens";

export type JokkoTheme = {
  colors: V2Palette;
  dark: boolean;
  radius: V2Radius;
  font: FontFamily;
};

// `undefined` = no explicit choice → fall back to the system color scheme.
const ThemeContext = createContext<boolean | undefined>(undefined);

/**
 * Art-directs a subtree's light/dark mode. The Jokko v2 design is art-directed
 * per screen (onboarding is dark, chat is light by default, etc.) rather than a
 * single global toggle — wrap a screen in `<ThemeProvider dark>` to force it.
 */
export function ThemeProvider({ dark, children }: { dark?: boolean; children: ReactNode }) {
  return <ThemeContext.Provider value={dark}>{children}</ThemeContext.Provider>;
}

/**
 * Returns the v2 palette + radii + font families. Resolution order for dark mode:
 * explicit `override` arg → nearest `<ThemeProvider>` → system color scheme.
 */
export function useTheme(override?: boolean): JokkoTheme {
  const ctxDark = useContext(ThemeContext);
  const scheme = useColorScheme();
  const dark = override ?? ctxDark ?? scheme === "dark";
  return {
    colors: dark ? v2Dark : v2Light,
    dark,
    radius: v2Radius,
    font: fontFamily,
  };
}

/** Non-hook accessor (navigation options, imperative code). */
export function getTheme(dark: boolean): JokkoTheme {
  return { colors: dark ? v2Dark : v2Light, dark, radius: v2Radius, font: fontFamily };
}
