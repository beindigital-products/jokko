import { useLocalSearchParams } from "expo-router";
import { LegacyScreen } from "@jokko/ui-mobile";
import { MobileShortcutDetailScreen } from "../../../src/MobileShortcutDetailScreen";

export default function ShortcutDetailRoute() {
    const params = useLocalSearchParams<{ id?: string }>();
    return (
        <LegacyScreen>
            <MobileShortcutDetailScreen
                shortcutId={typeof params.id === "string" ? params.id : null}
            />
        </LegacyScreen>
    );
}
