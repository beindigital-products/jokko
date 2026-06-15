import { useLocalSearchParams } from "expo-router";
import { PasswordResetScreen } from "../../src/PasswordResetScreen";

export default function ForgotPasswordRoute() {
    const params = useLocalSearchParams<{ email?: string }>();

    return (
        <PasswordResetScreen
            mode="request"
            initialEmail={params.email}
        />
    );
}
