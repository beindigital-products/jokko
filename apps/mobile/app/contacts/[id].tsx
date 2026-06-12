import { useLocalSearchParams } from "expo-router";
import { LegacyScreen } from "@jokko/ui-mobile";
import { MobileContactDetailScreen } from "../../src/MobileContactDetailScreen";

export default function ContactDetailRoute() {
    const params = useLocalSearchParams<{ id?: string }>();
    return (
        <LegacyScreen>
            <MobileContactDetailScreen contactId={typeof params.id === "string" ? params.id : null} />
        </LegacyScreen>
    );
}
