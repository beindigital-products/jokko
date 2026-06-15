import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useConvexAuth, useMutation } from "convex/react";
import { AuthScreen } from "../../src/AuthScreen";
import { api } from "../../../../convex/_generated/api";

export default function InviteRoute() {
    const params = useLocalSearchParams<{ token: string }>();
    const router = useRouter();
    const auth = useConvexAuth();
    const acceptInvitation = useMutation(api.invitations.acceptLink);
    const token = Array.isArray(params.token) ? params.token[0] : params.token;

    useEffect(() => {
        if (!auth.isAuthenticated || !token) return;
        acceptInvitation({ token })
            .then(() => router.replace("/boot"))
            .catch(() => router.replace({
                pathname: "/auth/sign-in",
                params: { inviteToken: token },
            } as never));
    }, [acceptInvitation, auth.isAuthenticated, router, token]);

    return <AuthScreen mode="sign-up" inviteToken={token} redirectTo="/boot" />;
}
