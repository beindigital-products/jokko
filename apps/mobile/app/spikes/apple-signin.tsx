import { useTranslation } from "react-i18next";
import { SpikeAppleSignIn } from "../../src/SpikeAppleSignIn";
import { SpikeFrame } from "../../src/SpikeFrame";

export default function AppleSignInRoute() {
    const { t } = useTranslation();

    return (
        <SpikeFrame title={t("spikes.apple")}>
            <SpikeAppleSignIn />
        </SpikeFrame>
    );
}
