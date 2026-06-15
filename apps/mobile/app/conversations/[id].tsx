import { useLocalSearchParams } from "expo-router";
import { Screen } from "@jokko/ui-mobile";
import { MobileConversationScreen } from "../../src/MobileConversationScreen";

export default function ConversationRoute() {
    const params = useLocalSearchParams<{ id?: string }>();
    return (
        <Screen>
            <MobileConversationScreen conversationId={typeof params.id === "string" ? params.id : null} />
        </Screen>
    );
}
