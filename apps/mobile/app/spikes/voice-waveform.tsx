import { useTranslation } from "react-i18next";
import { VoiceWaveform } from "../../src/VoiceWaveform";
import { SpikeFrame } from "../../src/SpikeFrame";

export default function VoiceWaveformRoute() {
    const { t } = useTranslation();

    return (
        <SpikeFrame title={t("spikes.voice")}>
            <VoiceWaveform />
        </SpikeFrame>
    );
}
