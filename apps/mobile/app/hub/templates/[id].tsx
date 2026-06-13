import { useLocalSearchParams } from "expo-router";
import { Screen } from "@jokko/ui-mobile";
import { MobileTemplateDetailScreen } from "../../../src/MobileTemplateDetailScreen";

export default function TemplateDetailRoute() {
    const params = useLocalSearchParams<{ id?: string }>();
    return (
        <Screen>
            <MobileTemplateDetailScreen
                templateId={typeof params.id === "string" ? params.id : null}
            />
        </Screen>
    );
}
