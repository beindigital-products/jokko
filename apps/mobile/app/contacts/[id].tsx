import { useLocalSearchParams } from "expo-router";
import { Screen } from "@jokko/ui-mobile";
import { MobileContactDetailScreen } from "../../src/MobileContactDetailScreen";

export default function ContactDetailRoute() {
    const params = useLocalSearchParams<{ id?: string }>();
    return (
        <Screen>
            <MobileContactDetailScreen contactId={typeof params.id === "string" ? params.id : null} />
        </Screen>
    );
}
