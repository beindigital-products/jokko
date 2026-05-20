import { useLocalSearchParams } from "expo-router";
import { AuthScreen } from "../../src/AuthScreen";

export default function SignInRoute() {
    const params = useLocalSearchParams<{ redirectTo?: string; inviteToken?: string }>();

    return (
        <AuthScreen
            mode="sign-in"
            redirectTo={params.redirectTo}
            inviteToken={params.inviteToken}
        />
    );
}
