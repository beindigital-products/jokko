import type { ComponentProps, ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@jokko/tokens";

export type IconName = ComponentProps<typeof Ionicons>["name"];

export function ScreenSurface({
  children,
  centered = false,
  padded = true,
}: {
  children: ReactNode;
  centered?: boolean;
  padded?: boolean;
}) {
  return (
    <View style={[styles.screen, padded && styles.screenPadded, centered && styles.screenCentered]}>
      {children}
    </View>
  );
}

export function IconBadge({ name, tone = "accent" }: { name: IconName; tone?: "accent" | "success" }) {
  return (
    <View style={[styles.iconBadge, tone === "success" && styles.iconBadgeSuccess]}>
      <Ionicons name={name} size={28} color={tone === "success" ? "#fff" : theme.accent.primary} />
    </View>
  );
}

export function PrimaryAction({
  label,
  icon,
  onPress,
  disabled = false,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryAction,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={styles.primaryActionText}>{label}</Text>
      {icon ? <Ionicons name={icon} size={18} color="#fff" /> : null}
    </Pressable>
  );
}

export function SecondaryAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}
    >
      <Text style={styles.secondaryActionText}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  primary,
  secondary,
}: {
  icon: IconName;
  title: string;
  body: string;
  primary?: { label: string; onPress: () => void };
  secondary?: { label: string; onPress: () => void };
}) {
  return (
    <ScreenSurface centered>
      <IconBadge name={icon} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {primary ? <PrimaryAction label={primary.label} onPress={primary.onPress} /> : null}
      {secondary ? <SecondaryAction label={secondary.label} onPress={secondary.onPress} /> : null}
    </ScreenSurface>
  );
}

export type ConsentModalValue = {
  crashReporting: boolean;
  productAnalytics: boolean;
};

export type ConsentModalCopy = {
  title: string;
  body: string;
  crashTitle: string;
  crashBody: string;
  analyticsTitle: string;
  analyticsBody: string;
  accept: string;
};

export function ConsentModal({
  visible,
  value,
  copy,
  onChange,
  onAccept,
}: {
  visible: boolean;
  value: ConsentModalValue;
  copy: ConsentModalCopy;
  onChange: (value: ConsentModalValue) => void;
  onAccept: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" presentationStyle="overFullScreen">
      <View style={styles.modalScrim}>
        <View style={styles.modalPanel}>
          <Text style={styles.modalTitle}>{copy.title}</Text>
          <Text style={styles.modalBody}>{copy.body}</Text>
          <ConsentRow
            title={copy.crashTitle}
            body={copy.crashBody}
            value={value.crashReporting}
            onValueChange={(crashReporting) => onChange({ ...value, crashReporting })}
          />
          <ConsentRow
            title={copy.analyticsTitle}
            body={copy.analyticsBody}
            value={value.productAnalytics}
            onValueChange={(productAnalytics) => onChange({ ...value, productAnalytics })}
          />
          <PrimaryAction label={copy.accept} onPress={onAccept} icon="checkmark" />
        </View>
      </View>
    </Modal>
  );
}

function ConsentRow({
  title,
  body,
  value,
  onValueChange,
}: {
  title: string;
  body: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.consentRow}>
      <View style={styles.consentText}>
        <Text style={styles.consentTitle}>{title}</Text>
        <Text style={styles.consentBody}>{body}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.ink[300], true: theme.accent.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.surface.default,
  },
  screenPadded: {
    padding: theme.spacing.xl,
  },
  screenCentered: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.surface.raised,
    borderWidth: 1,
    borderColor: theme.ink[300],
    marginBottom: theme.spacing.lg,
  },
  iconBadgeSuccess: {
    backgroundColor: theme.semantic.success,
    borderColor: theme.semantic.success,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.ink[900],
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.ink[500],
    textAlign: "center",
    maxWidth: 320,
    marginBottom: theme.spacing.xl,
  },
  primaryAction: {
    minHeight: 50,
    alignSelf: "stretch",
    borderRadius: theme.radius.pill,
    backgroundColor: theme.ink[900],
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  primaryActionText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryAction: {
    minHeight: 46,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionText: {
    color: theme.accent.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.65,
  },
  modalScrim: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(26, 24, 20, 0.36)",
  },
  modalPanel: {
    backgroundColor: theme.surface.raised,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  modalTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: theme.ink[900],
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.ink[500],
  },
  consentRow: {
    minHeight: 78,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.ink[300],
    backgroundColor: theme.surface.default,
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  consentText: {
    flex: 1,
    minWidth: 0,
  },
  consentTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.ink[900],
  },
  consentBody: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 18,
    color: theme.ink[500],
  },
});
