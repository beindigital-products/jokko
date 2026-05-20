import { useLocalSearchParams } from "expo-router";
import { MobileContactDetailScreen } from "../../src/MobileContactDetailScreen";

export default function ContactDetailRoute() {
    const params = useLocalSearchParams<{ id?: string }>();
    return <MobileContactDetailScreen contactId={typeof params.id === "string" ? params.id : null} />;
}
