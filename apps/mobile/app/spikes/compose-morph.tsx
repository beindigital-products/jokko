import { useTranslation } from "react-i18next";
import { ComposeMorph } from "../../src/ComposeMorph";
import { SpikeFrame } from "../../src/SpikeFrame";

export default function ComposeMorphRoute() {
    const { t } = useTranslation();

    return (
        <SpikeFrame title={t("spikes.composeMorph")}>
            <ComposeMorph />
        </SpikeFrame>
    );
}
