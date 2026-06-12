/**
 * Jokko v2 mobile kit — React Native port of the design bundle's `v2/kit.jsx`.
 * Atoms shared across every screen: Avatar, Pill, Btn, NavBar, TabBar, Field,
 * Row, SectionHead, Bubble, Composer, Skeleton, GlassPill, Sheet, Wordmark.
 *
 * Colors come from `useTheme()` (art-directed per screen). Web CSS features with
 * no RN equivalent are adapted: backdrop-blur → expo-blur, box-shadow → native
 * shadow props, color-mix → precomputed rgba tints, CSS gradient → Animated pulse.
 */
import { useEffect, useRef, type ReactNode } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { BlurView } from "expo-blur";
import { Icon } from "./Icon";
import type { IconName } from "./icons-data";
import { avatarInitials, avatarTone, tint } from "./kit-utils";
import { useTheme } from "./theme";

// ── Avatar ───────────────────────────────────────────────────────────────────

export function Avatar({
  name = "",
  size = 40,
  tone,
  ring = false,
  status,
}: {
  name?: string;
  size?: number;
  tone?: string;
  ring?: boolean;
  status?: "online" | "offline";
}) {
  const { colors, font } = useTheme();
  const initials = avatarInitials(name);
  const bg = tone || avatarTone(name);

  const circle = (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: "#F2EFE8",
          fontFamily: font.sansMedium,
          fontSize: size * 0.36,
          letterSpacing: -0.4,
        }}
      >
        {initials}
      </Text>
    </View>
  );

  return (
    <View style={{ width: size, height: size }}>
      {ring ? (
        <View
          style={{
            padding: 2,
            borderRadius: (size + 8) / 2,
            borderWidth: 2,
            borderColor: colors.accent,
            backgroundColor: colors.paper,
            margin: -4,
          }}
        >
          {circle}
        </View>
      ) : (
        circle
      )}
      {status ? (
        <View
          style={{
            position: "absolute",
            bottom: -1,
            right: -1,
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: size * 0.14,
            backgroundColor: status === "online" ? colors.good : colors.mute,
            borderWidth: 2.5,
            borderColor: colors.paper,
          }}
        />
      ) : null}
    </View>
  );
}

// ── Pill ─────────────────────────────────────────────────────────────────────

export type PillTone = "mute" | "accent" | "ink" | "good" | "hot" | "warn" | "outline";

export function Pill({
  children,
  tone = "mute",
  size = "md",
  icon,
  style,
}: {
  children: ReactNode;
  tone?: PillTone;
  size?: "sm" | "md" | "lg";
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, font } = useTheme();
  const tones: Record<PillTone, { bg: string; fg: string; border?: string }> = {
    mute: { bg: colors.paper2, fg: colors.ink3 },
    accent: { bg: colors.accentSoft, fg: colors.accentInk },
    ink: { bg: colors.ink, fg: colors.paper },
    good: { bg: tint(colors.good, 0.14), fg: colors.good },
    hot: { bg: tint(colors.hot, 0.14), fg: colors.hot },
    warn: { bg: tint(colors.warn, 0.16), fg: colors.warn },
    outline: { bg: "transparent", fg: colors.ink3, border: colors.rule },
  };
  const t = tones[tone] ?? tones.mute;
  const sz =
    size === "sm"
      ? { h: 18, px: 7, fs: 10, gap: 4 }
      : size === "lg"
        ? { h: 28, px: 12, fs: 12.5, gap: 6 }
        : { h: 22, px: 9, fs: 11, gap: 5 };
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: sz.gap,
          height: sz.h,
          paddingHorizontal: sz.px,
          borderRadius: 999,
          backgroundColor: t.bg,
          borderWidth: t.border ? 1 : 0,
          borderColor: t.border,
          alignSelf: "flex-start",
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={sz.fs + 2} color={t.fg} strokeWidth={1.8} /> : null}
      <Text
        style={{
          color: t.fg,
          fontFamily: font.monoMedium,
          fontSize: sz.fs,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        {children}
      </Text>
    </View>
  );
}

// ── Button ───────────────────────────────────────────────────────────────────

export type BtnTone = "primary" | "accent" | "ghost" | "soft" | "link" | "danger";

export function Btn({
  children,
  tone = "primary",
  size = "md",
  icon,
  iconRight,
  full = false,
  disabled = false,
  onPress,
  style,
}: {
  children: ReactNode;
  tone?: BtnTone;
  size?: "sm" | "md" | "lg";
  icon?: IconName;
  iconRight?: IconName;
  full?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, font } = useTheme();
  const tones: Record<BtnTone, { bg: string; fg: string; border?: string }> = {
    primary: { bg: colors.ink, fg: colors.paper },
    accent: { bg: colors.accent, fg: "#fff" },
    ghost: { bg: "transparent", fg: colors.ink, border: colors.rule },
    soft: { bg: colors.paper2, fg: colors.ink },
    link: { bg: "transparent", fg: colors.accentInk },
    danger: { bg: tint(colors.hot, 0.12), fg: colors.hot },
  };
  const t = tones[tone] ?? tones.primary;
  const sizes = {
    sm: { h: 32, px: 12, fs: 13, r: 10 },
    md: { h: 44, px: 18, fs: 15, r: 12 },
    lg: { h: 54, px: 22, fs: 16, r: 14 },
  };
  const s = sizes[size] ?? sizes.md;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          height: s.h,
          paddingHorizontal: s.px,
          borderRadius: s.r,
          backgroundColor: t.bg,
          borderWidth: t.border ? 1 : 0,
          borderColor: t.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: full ? "100%" : undefined,
          alignSelf: full ? "stretch" : "flex-start",
          opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={s.fs + 4} color={t.fg} strokeWidth={1.8} /> : null}
      <Text style={{ color: t.fg, fontFamily: font.sansMedium, fontSize: s.fs, letterSpacing: -0.1 }}>
        {children}
      </Text>
      {iconRight ? <Icon name={iconRight} size={s.fs + 4} color={t.fg} strokeWidth={1.8} /> : null}
    </Pressable>
  );
}

// ── NavBar ───────────────────────────────────────────────────────────────────

export function NavBar({
  title,
  eyebrow,
  left,
  right,
  center,
  large = false,
  style,
}: {
  title?: string;
  eyebrow?: string;
  left?: ReactNode;
  right?: ReactNode;
  center?: ReactNode;
  large?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, font } = useTheme();
  return (
    <View
      style={[
        { paddingHorizontal: large ? 20 : 16, paddingTop: 4, paddingBottom: large ? 14 : 12, gap: 4 },
        style,
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 36,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>{left}</View>
        {center && !large ? (
          <Text style={{ fontSize: 16, fontFamily: font.sansSemibold, color: colors.ink }}>{center}</Text>
        ) : null}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>{right}</View>
      </View>
      {large && title ? (
        <View style={{ paddingTop: 8 }}>
          {eyebrow ? <Micro style={{ marginBottom: 6 }}>{eyebrow}</Micro> : null}
          <Text
            style={{
              fontFamily: font.display,
              fontSize: 44,
              lineHeight: 46,
              letterSpacing: -1.6,
              color: colors.ink,
            }}
          >
            {title}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export function NavButton({
  icon,
  onPress,
  color,
  style,
}: {
  icon: IconName;
  onPress?: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: 36,
          height: 36,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.6 : 1,
        },
        style,
      ]}
    >
      <Icon name={icon} size={22} color={color ?? colors.ink} />
    </Pressable>
  );
}

// ── TabBar (bottom) ──────────────────────────────────────────────────────────

export type TabId = "inbox" | "hub" | "contacts" | "settings";

export function TabBar({
  active = "inbox",
  counts = {},
  onTab,
}: {
  active?: TabId;
  counts?: Partial<Record<TabId, number>>;
  onTab?: (id: TabId) => void;
}) {
  const { colors, dark, font } = useTheme();
  const tabs: { id: TabId; label: string; icon: IconName }[] = [
    { id: "inbox", label: "Inbox", icon: "inbox" },
    { id: "hub", label: "Hub", icon: "hub" },
    { id: "contacts", label: "Contacts", icon: "users" },
    { id: "settings", label: "Réglages", icon: "cog" },
  ];
  return (
    <BlurView
      intensity={28}
      tint={dark ? "dark" : "light"}
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingTop: 8,
        paddingBottom: 28,
        paddingHorizontal: 14,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.rule2,
        backgroundColor: tint(colors.paper, 0.7),
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
      }}
    >
      {tabs.map((t) => {
        const on = t.id === active;
        const count = counts[t.id] ?? 0;
        return (
          <Pressable
            key={t.id}
            accessibilityRole="button"
            onPress={() => onTab?.(t.id)}
            style={{ alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 4 }}
          >
            <View>
              <Icon name={t.icon} size={23} color={on ? colors.ink : colors.mute} strokeWidth={on ? 1.9 : 1.5} />
              {count > 0 ? (
                <View
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -8,
                    minWidth: 16,
                    height: 16,
                    paddingHorizontal: 4,
                    borderRadius: 999,
                    backgroundColor: colors.hot,
                    borderWidth: 2,
                    borderColor: colors.paper,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontFamily: font.monoMedium, fontSize: 9.5 }}>
                    {count > 99 ? "99+" : count}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text
              style={{ fontSize: 10, fontFamily: font.sansMedium, color: on ? colors.ink : colors.mute }}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </BlurView>
  );
}

// ── Field (functional text input) ────────────────────────────────────────────

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  hint,
  error,
  secureTextEntry,
  autoCapitalize = "none",
  keyboardType,
  onToggleSecure,
  style,
}: {
  label?: string;
  value?: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  icon?: IconName;
  hint?: string;
  error?: boolean;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "phone-pad" | "number-pad";
  onToggleSecure?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, font } = useTheme();
  return (
    <View style={[{ gap: 6 }, style]}>
      {label ? <Micro>{label}</Micro> : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          height: 50,
          paddingHorizontal: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: error ? colors.hot : colors.rule,
          backgroundColor: colors.card,
        }}
      >
        {icon ? <Icon name={icon} size={18} color={colors.mute} /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mute}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          style={{ flex: 1, fontSize: 16, color: colors.ink, fontFamily: font.sans, padding: 0 }}
        />
        {onToggleSecure ? (
          <Pressable onPress={onToggleSecure} hitSlop={8}>
            <Icon name={secureTextEntry ? "eye" : "eye-off"} size={18} color={colors.mute} />
          </Pressable>
        ) : null}
      </View>
      {hint ? (
        <Text style={{ fontSize: 12, color: error ? colors.hot : colors.mute, fontFamily: font.sans }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

// ── Row ──────────────────────────────────────────────────────────────────────

export function Row({
  icon,
  title,
  sub,
  right,
  accessory = "chevron",
  danger = false,
  onPress,
  style,
}: {
  icon?: IconName;
  title: string;
  sub?: string;
  right?: ReactNode;
  accessory?: "chevron" | "none";
  danger?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, font } = useTheme();
  const fg = danger ? colors.hot : colors.ink;
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          paddingHorizontal: 18,
          paddingVertical: 14,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.rule2,
          backgroundColor: pressed && onPress ? colors.paper2 : "transparent",
        },
        style,
      ]}
    >
      {icon ? (
        <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={20} color={danger ? colors.hot : colors.ink3} strokeWidth={1.6} />
        </View>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 15.5, fontFamily: font.sansMedium, color: fg, letterSpacing: -0.15 }}>
          {title}
        </Text>
        {sub ? (
          <Text style={{ fontSize: 13, color: colors.mute, marginTop: 1, fontFamily: font.sans }}>{sub}</Text>
        ) : null}
      </View>
      {right ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>{right}</View>
      ) : accessory === "chevron" ? (
        <Icon name="chevron-right" size={18} color={colors.mute2} />
      ) : null}
    </Pressable>
  );
}

// ── SectionHead + Micro caps ─────────────────────────────────────────────────

export function Micro({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const { colors, font } = useTheme();
  return (
    <Text
      style={[
        {
          fontFamily: font.monoMedium,
          fontSize: 10.5,
          letterSpacing: 0.85,
          textTransform: "uppercase",
          color: colors.mute,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function SectionHead({ children, action }: { children: ReactNode; action?: ReactNode }) {
  const { colors, font } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 8,
      }}
    >
      <Micro>{children}</Micro>
      {action ? (
        <Text style={{ fontSize: 12, color: colors.accentInk, fontFamily: font.sansMedium }}>{action}</Text>
      ) : null}
    </View>
  );
}

// ── Chat bubble ──────────────────────────────────────────────────────────────

export type BubbleStateName = "queued" | "sent" | "delivered" | "read" | "failed";

export function BubbleState({ state, color }: { state: BubbleStateName; color: string }) {
  if (state === "queued") return <Icon name="clock" size={11} color={color} strokeWidth={2} />;
  if (state === "sent") return <Icon name="check" size={11} color={color} strokeWidth={2.4} />;
  if (state === "delivered") return <Icon name="check-double" size={12} color={color} strokeWidth={2.4} />;
  if (state === "read") return <Icon name="check-double" size={12} color="#4D9CFF" strokeWidth={2.4} />;
  if (state === "failed") return <Text style={{ color: "#DC3838", fontSize: 11 }}>✕</Text>;
  return null;
}

export function Bubble({
  side = "in",
  children,
  time,
  state,
  reactions,
  replyTo,
  media,
  tail = true,
  dimmed = false,
}: {
  side?: "in" | "out";
  children?: ReactNode;
  time?: string;
  state?: BubbleStateName;
  reactions?: string[];
  replyTo?: { author: string; text: string };
  media?: ReactNode;
  tail?: boolean;
  dimmed?: boolean;
}) {
  const { colors, font } = useTheme();
  const isOut = side === "out";
  const metaColor = isOut ? colors.bubbleOutInk : colors.ink;
  return (
    <View
      style={{
        alignItems: isOut ? "flex-end" : "flex-start",
        paddingLeft: isOut ? 60 : 0,
        paddingRight: isOut ? 0 : 60,
        gap: 3,
        opacity: dimmed ? 0.35 : 1,
      }}
    >
      {replyTo ? (
        <View
          style={{
            maxWidth: "100%",
            marginBottom: -8,
            paddingTop: 8,
            paddingBottom: 16,
            paddingHorizontal: 12,
            borderTopLeftRadius: 14,
            borderTopRightRadius: 14,
            borderBottomRightRadius: 14,
            borderBottomLeftRadius: 4,
            backgroundColor: isOut ? tint(colors.bubbleOut, 0.88) : colors.paper2,
            borderLeftWidth: 2.5,
            borderLeftColor: isOut ? colors.paper : colors.accent,
          }}
        >
          <Text
            style={{
              fontFamily: font.sansSemibold,
              fontSize: 11.5,
              marginBottom: 2,
              opacity: 0.7,
              color: isOut ? colors.bubbleOutInk : colors.ink3,
            }}
          >
            {replyTo.author}
          </Text>
          <Text
            style={{
              fontSize: 12.5,
              opacity: 0.85,
              color: isOut ? colors.bubbleOutInk : colors.ink3,
              fontFamily: font.sans,
            }}
          >
            {replyTo.text}
          </Text>
        </View>
      ) : null}
      <View
        style={{
          maxWidth: "100%",
          padding: media ? 4 : undefined,
          paddingHorizontal: media ? 4 : 13,
          paddingVertical: media ? 4 : 9,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          borderBottomRightRadius: isOut ? (tail ? 6 : 18) : 18,
          borderBottomLeftRadius: isOut ? 18 : tail ? 6 : 18,
          backgroundColor: isOut ? colors.bubbleOut : colors.bubbleIn,
          borderWidth: isOut ? 0 : StyleSheet.hairlineWidth,
          borderColor: colors.rule,
        }}
      >
        {media}
        {children ? (
          <Text
            style={{
              fontSize: 15,
              lineHeight: 20,
              color: isOut ? colors.bubbleOutInk : colors.ink,
              fontFamily: font.sans,
              paddingHorizontal: media ? 8 : 0,
              paddingTop: media ? 6 : 0,
              paddingBottom: media ? 4 : 0,
            }}
          >
            {children}
          </Text>
        ) : null}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 4,
            marginTop: 3,
            paddingHorizontal: media ? 8 : 0,
            paddingBottom: media ? 4 : 0,
          }}
        >
          {time ? (
            <Text style={{ fontFamily: font.mono, fontSize: 9.5, opacity: 0.55, color: metaColor }}>
              {time}
            </Text>
          ) : null}
          {isOut && state ? <BubbleState state={state} color={tint(metaColor === "#FAFAFA" ? "#FAFAFA" : "#252525", 1)} /> : null}
        </View>
      </View>
      {reactions && reactions.length > 0 ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            marginTop: -8,
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 999,
            backgroundColor: isOut ? colors.bubbleOut : colors.bubbleIn,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.rule,
          }}
        >
          {reactions.map((r, i) => (
            <Text key={i} style={{ fontSize: 12 }}>
              {r}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ── Composer ─────────────────────────────────────────────────────────────────

export function Composer({
  value = "",
  onChangeText,
  onSend,
  onPlus,
  onMic,
  placeholder = "Message",
  accent,
}: {
  value?: string;
  onChangeText?: (v: string) => void;
  onSend?: () => void;
  onPlus?: () => void;
  onMic?: () => void;
  placeholder?: string;
  accent?: string;
}) {
  const { colors, dark, font } = useTheme();
  const hasText = value.trim().length > 0;
  return (
    <BlurView
      intensity={24}
      tint={dark ? "dark" : "light"}
      style={{
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.rule2,
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 8,
        backgroundColor: tint(colors.paper, 0.85),
      }}
    >
      <Pressable
        onPress={onPlus}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.paper2,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="plus" size={20} color={colors.ink2} />
      </Pressable>

      <View
        style={{
          flex: 1,
          minHeight: 36,
          borderRadius: hasText ? 18 : 22,
          backgroundColor: colors.card,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.rule,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 12,
          paddingVertical: 6,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mute}
          multiline
          style={{ flex: 1, fontSize: 15.5, lineHeight: 20, color: colors.ink, fontFamily: font.sans, padding: 0 }}
        />
        {!hasText ? <Icon name="camera" size={18} color={colors.mute} /> : null}
      </View>

      {hasText ? (
        <Pressable
          onPress={onSend}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: accent ?? colors.ink,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="send" size={18} color={colors.paper} strokeWidth={2} />
        </Pressable>
      ) : (
        <Pressable
          onPress={onMic}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.paper2,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="mic" size={20} color={colors.ink2} />
        </Pressable>
      )}
    </BlurView>
  );
}

// ── Skeleton (shimmer) ───────────────────────────────────────────────────────

export function Skeleton({
  w = "100%",
  h = 12,
  r = 6,
  style,
}: {
  w?: number | `${number}%` | "100%";
  h?: number;
  r?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View
      style={[{ width: w, height: h, borderRadius: r, backgroundColor: colors.rule2, opacity: pulse }, style]}
    />
  );
}

// ── GlassPill (descends from the notch) ──────────────────────────────────────

export function GlassPill({ children, icon, style }: { children: ReactNode; icon?: IconName; style?: StyleProp<ViewStyle> }) {
  const { colors, font } = useTheme();
  return (
    <BlurView
      intensity={30}
      tint="dark"
      style={[
        {
          position: "absolute",
          top: 56,
          alignSelf: "center",
          paddingHorizontal: 14,
          paddingVertical: 7,
          borderRadius: 999,
          backgroundColor: tint(colors.ink, 0.82),
          flexDirection: "row",
          alignItems: "center",
          gap: 7,
          zIndex: 20,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={13} color="#fff" strokeWidth={1.8} /> : null}
      <Text style={{ color: "#fff", fontSize: 12.5, fontFamily: font.sansMedium }}>{children}</Text>
    </BlurView>
  );
}

// ── Bottom sheet shell (presentational; wrap in RN Modal for behavior) ───────

export function Sheet({
  children,
  title,
  eyebrow,
  height = 480,
  scrim = true,
  handle = true,
  onScrimPress,
}: {
  children: ReactNode;
  title?: string;
  eyebrow?: string;
  height?: number;
  scrim?: boolean;
  handle?: boolean;
  onScrimPress?: () => void;
}) {
  const { colors, font } = useTheme();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {scrim ? (
        <Pressable onPress={onScrimPress} style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(10,10,10,0.4)" }]} />
      ) : null}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height,
          backgroundColor: colors.paper,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          overflow: "hidden",
        }}
      >
        {handle ? (
          <View style={{ width: 36, height: 5, borderRadius: 3, backgroundColor: colors.rule, alignSelf: "center", marginTop: 8, marginBottom: 4 }} />
        ) : null}
        {title || eyebrow ? (
          <View style={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: 14 }}>
            {eyebrow ? <Micro style={{ marginBottom: 4 }}>{eyebrow}</Micro> : null}
            {title ? (
              <Text style={{ fontFamily: font.display, fontSize: 30, letterSpacing: -1, color: colors.ink }}>
                {title}
              </Text>
            ) : null}
          </View>
        ) : null}
        <View style={{ flex: 1 }}>{children}</View>
      </View>
    </View>
  );
}

// ── Wordmark ─────────────────────────────────────────────────────────────────

export function Wordmark({ size = 28, color, dot = true }: { size?: number; color?: string; dot?: boolean }) {
  const { colors, font } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2 }}>
      <Text style={{ fontFamily: font.displayItalic, fontSize: size, lineHeight: size, letterSpacing: -0.5, color: color ?? colors.ink }}>
        Jokko
      </Text>
      {dot ? (
        <View style={{ width: size * 0.18, height: size * 0.18, borderRadius: size * 0.09, backgroundColor: colors.accent, marginBottom: size * 0.12 }} />
      ) : null}
    </View>
  );
}
