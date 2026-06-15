import { useLocalSearchParams } from "expo-router";
import { Screen } from "@jokko/ui-mobile";
import { MobileShortcutDetailScreen } from "../../../src/MobileShortcutDetailScreen";

export default function ShortcutDetailRoute() {
    const params = useLocalSearchParams<{ id?: string }>();
    return (
        <Screen>
            <MobileShortcutDetailScreen
                shortcutId={typeof params.id === "string" ? params.id : null}
            />
        </Screen>
    );
}
