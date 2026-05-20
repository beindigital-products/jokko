import { useLocalSearchParams } from "expo-router";
import { AuthScreen } from "../../src/AuthScreen";

export default function SignUpRoute() {
    const params = useLocalSearchParams<{ redirectTo?: string; inviteToken?: string }>();

    return (
        <AuthScreen
            mode="sign-up"
            redirectTo={params.redirectTo}
            inviteToken={params.inviteToken}
        />
    );
}
