import { useTranslation } from "react-i18next";
import { InboxBreathing } from "../../src/InboxBreathing";
import { SpikeFrame } from "../../src/SpikeFrame";

export default function InboxBreathingRoute() {
    const { t } = useTranslation();

    return (
        <SpikeFrame title={t("spikes.inboxBreathing")}>
            <InboxBreathing />
        </SpikeFrame>
    );
}
