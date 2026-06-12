// ── Jokko v2 design system (mobile) ──────────────────────────────────────────
export { ThemeProvider, useTheme, getTheme, type JokkoTheme } from "./theme";
export { Icon, type IconName } from "./Icon";
export { ICONS } from "./icons-data";
export {
  Avatar,
  Pill,
  Btn,
  NavBar,
  NavButton,
  TabBar,
  Field,
  Row,
  Micro,
  SectionHead,
  Bubble,
  BubbleState,
  Composer,
  Skeleton,
  GlassPill,
  Sheet,
  Wordmark,
  type PillTone,
  type BtnTone,
  type TabId,
  type BubbleStateName,
} from "./kit";

// ── Legacy primitives (still used by not-yet-migrated screens) ───────────────
export {
  ConsentModal,
  EmptyState,
  IconBadge,
  PrimaryAction,
  ScreenSurface,
  SecondaryAction,
  type ConsentModalCopy,
  type ConsentModalValue,
} from "./primitives";
