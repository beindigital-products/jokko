import { useLocalSearchParams } from "expo-router";
import { PasswordResetScreen } from "../../src/PasswordResetScreen";

export default function ResetPasswordRoute() {
    const params = useLocalSearchParams<{ email?: string; code?: string }>();

    return (
        <PasswordResetScreen
            mode="confirm"
            initialEmail={params.email}
            initialCode={params.code}
        />
    );
}
