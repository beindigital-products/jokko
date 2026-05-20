import { useLocalSearchParams } from "expo-router";
import { MobileShortcutDetailScreen } from "../../../src/MobileShortcutDetailScreen";

export default function ShortcutDetailRoute() {
    const params = useLocalSearchParams<{ id?: string }>();
    return (
        <MobileShortcutDetailScreen
            shortcutId={typeof params.id === "string" ? params.id : null}
        />
    );
}
