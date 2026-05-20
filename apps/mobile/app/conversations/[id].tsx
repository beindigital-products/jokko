import { useLocalSearchParams } from "expo-router";
import { MobileConversationScreen } from "../../src/MobileConversationScreen";

export default function ConversationRoute() {
    const params = useLocalSearchParams<{ id?: string }>();
    return <MobileConversationScreen conversationId={typeof params.id === "string" ? params.id : null} />;
}
