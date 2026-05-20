import { useTranslation } from "react-i18next";
import { GlassReply } from "../../src/GlassReply";
import { SpikeFrame } from "../../src/SpikeFrame";

export default function GlassReplyRoute() {
    const { t } = useTranslation();

    return (
        <SpikeFrame title={t("spikes.glassReply")}>
            <GlassReply />
        </SpikeFrame>
    );
}
