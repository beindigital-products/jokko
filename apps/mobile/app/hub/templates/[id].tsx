import { useLocalSearchParams } from "expo-router";
import { LegacyScreen } from "@jokko/ui-mobile";
import { MobileTemplateDetailScreen } from "../../../src/MobileTemplateDetailScreen";

export default function TemplateDetailRoute() {
    const params = useLocalSearchParams<{ id?: string }>();
    return (
        <LegacyScreen>
            <MobileTemplateDetailScreen
                templateId={typeof params.id === "string" ? params.id : null}
            />
        </LegacyScreen>
    );
}
