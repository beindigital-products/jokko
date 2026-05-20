import { useLocalSearchParams } from "expo-router";
import { MobileTemplateDetailScreen } from "../../../src/MobileTemplateDetailScreen";

export default function TemplateDetailRoute() {
    const params = useLocalSearchParams<{ id?: string }>();
    return (
        <MobileTemplateDetailScreen
            templateId={typeof params.id === "string" ? params.id : null}
        />
    );
}
