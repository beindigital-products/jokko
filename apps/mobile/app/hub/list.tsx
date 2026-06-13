import { useLocalSearchParams } from "expo-router";
import { Screen } from "@jokko/ui-mobile";
import { MobileHubListScreen } from "../../src/MobileHubListScreen";

export default function HubListRoute() {
    const params = useLocalSearchParams<{ type?: string }>();
    const type = params.type === "shortcuts" ? "shortcuts" : "templates";
    return (
        <Screen>
            <MobileHubListScreen type={type} />
        </Screen>
    );
}
