import type { StyleProp, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { ICONS, type IconName } from "./icons-data";

export type { IconName };

/**
 * Stroke icon rendered from the design's exact 24×24 paths (see `icons-data.ts`).
 * 1.6px stroke, rounded caps/joins — matches the v2 design pixel-for-pixel.
 */
export function Icon({
  name,
  size = 22,
  color = "#252525",
  strokeWidth = 1.6,
  style,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const d = ICONS[name];
  if (!d) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path
        d={d}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
