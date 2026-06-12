import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
    applyRemoteAnswer,
    createIncomingAnswer,
    createOutgoingOffer,
    setMicMuted,
    setSpeakerphone,
    teardownPeer,
} from "./webrtc-peer";
import { CallOverlay, type CallPhase } from "./CallOverlay";

/**
 * Single mounted-at-root orchestrator for WhatsApp audio calls. Subscribes to
 * the call queries, drives the WebRTC handshake (offer/answer/ICE) through
 * webrtc-peer, and renders the full-screen call UI. Mounted ONLY in native
 * builds (see callsAvailable) so Expo Go never loads react-native-webrtc.
 */
export function CallHost() {
    const session = useQuery(api.sessions.current);
    const organizations = useQuery(api.organizations.listMine);
    const orgId = (session?.organization?._id ?? organizations?.[0]?._id ?? null) as Id<"organizations"> | null;

    const inbound = useQuery(api.calls.getActiveCall, orgId ? { organizationId: orgId } : "skip");
    const outbound = useQuery(api.calls.getMyOutboundCall, orgId ? { organizationId: orgId } : "skip");
    const active = useQuery(api.calls.getMyActiveCall, orgId ? { organizationId: orgId } : "skip");

    const startOutboundCall = useMutation(api.calls.startOutboundCall);
    const acceptCall = useMutation(api.calls.acceptCall);
    const confirmConnected = useMutation(api.calls.confirmConnected);
    const terminateCall = useMutation(api.calls.terminateCall);
    const rejectCall = useMutation(api.calls.rejectCall);

    const [phase, setPhase] = useState<CallPhase>("idle");
    const [muted, setMuted] = useState(false);
    const [speaker, setSpeaker] = useState(false);
    const [connectedAt, setConnectedAt] = useState<number | null>(null);

    const offerSentFor = useRef<string | null>(null);
    const answerAppliedFor = useRef<string | null>(null);
    const currentCallId = useRef<Id<"calls"> | null>(null);
    const watchedCallId = useRef<Id<"calls"> | null>(null);

    // The call to display — connected wins, then the outbound attempt, then inbound.
    const displayCall = active ?? outbound ?? inbound ?? null;
    if (displayCall) currentCallId.current = displayCall._id;
    const contactName = displayCall?.contact?.name || displayCall?.contact?.phone || "Contact";

    // Watch the last-known call's status so we can surface async failures
    // (CPR rejected, credit, 24h window) once it drops out of the live queries.
    const statusWatch = useQuery(
        api.calls.getCallStatusForAgent,
        watchedCallId.current ? { callId: watchedCallId.current } : "skip",
    );

    const reset = useCallback(() => {
        teardownPeer();
        offerSentFor.current = null;
        answerAppliedFor.current = null;
        currentCallId.current = null;
        setMuted(false);
        setSpeaker(false);
        setConnectedAt(null);
        setPhase("idle");
    }, []);

    const endSoon = useCallback(() => {
        teardownPeer();
        setPhase("ended");
        setTimeout(reset, 1200);
    }, [reset]);

    const onConnected = useCallback(
        (callId: Id<"calls">) => () => {
            setPhase("connected");
            setConnectedAt((prev) => prev ?? Date.now());
            void confirmConnected({ callId }).catch(() => undefined);
        },
        [confirmConnected],
    );

    // ── OUTBOUND: send the SDP offer once permission is granted ───────────────
    useEffect(() => {
        if (!outbound) return;
        watchedCallId.current = outbound._id;
        if (outbound.status === "REQUESTING_PERMISSION") setPhase((p) => (p === "idle" ? "outgoing" : p));
        if (outbound.status === "PERMISSION_GRANTED" && offerSentFor.current !== outbound._id) {
            offerSentFor.current = outbound._id;
            setPhase("outgoing");
            void (async () => {
                try {
                    const sdpOffer = await createOutgoingOffer({ onConnected: onConnected(outbound._id), onClosed: endSoon });
                    await startOutboundCall({ callId: outbound._id, sdpOffer });
                } catch (error) {
                    Alert.alert("Appel", error instanceof Error ? error.message : "Impossible de démarrer l'appel.");
                    endSoon();
                }
            })();
        }
    }, [outbound, onConnected, endSoon, startOutboundCall]);

    // ── OUTBOUND: apply Meta's SDP answer when the webhook delivers it ────────
    useEffect(() => {
        if (outbound?.sdpAnswer && answerAppliedFor.current !== outbound._id) {
            answerAppliedFor.current = outbound._id;
            void applyRemoteAnswer(outbound.sdpAnswer).catch(() => undefined);
        }
    }, [outbound?.sdpAnswer, outbound?._id]);

    // ── INBOUND: ring when an incoming call appears (and we're free) ──────────
    useEffect(() => {
        if (inbound?.status === "RINGING") {
            watchedCallId.current = inbound._id;
            setPhase((p) => (p === "idle" ? "incoming" : p));
        }
    }, [inbound?._id, inbound?.status]);

    // ── Connected via the live query (covers both directions) ─────────────────
    useEffect(() => {
        if (active?.status === "CONNECTED") {
            setPhase("connected");
            setConnectedAt((prev) => prev ?? (active.answeredAt ?? Date.now()));
        }
    }, [active?.status, active?.answeredAt]);

    // ── Cleanup: the call left every live query → it ended remotely ───────────
    useEffect(() => {
        const gone = inbound === null && outbound === null && active === null;
        if (gone && currentCallId.current && (phase === "connected" || phase === "connecting")) {
            endSoon();
        }
    }, [inbound, outbound, active, phase, endSoon]);

    // ── Surface terminal failures (FAILED / REJECTED) with a reason ───────────
    useEffect(() => {
        if (!statusWatch) return;
        const terminal = ["FAILED", "REJECTED", "MISSED", "TERMINATED"];
        if (terminal.includes(statusWatch.status) && (phase === "outgoing" || phase === "connecting")) {
            if (statusWatch.status === "FAILED" || statusWatch.status === "REJECTED" || statusWatch.status === "MISSED") {
                Alert.alert("Appel terminé", reasonLabel(statusWatch.status, statusWatch.terminationReason));
            }
            endSoon();
        }
    }, [statusWatch, phase, endSoon]);

    const handleAccept = useCallback(async () => {
        if (!inbound?.sdpOffer) return;
        setPhase("connecting");
        try {
            const sdpAnswer = await createIncomingAnswer(inbound.sdpOffer, { onConnected: onConnected(inbound._id), onClosed: endSoon });
            await acceptCall({ callId: inbound._id, sdpAnswer });
        } catch (error) {
            Alert.alert("Appel", error instanceof Error ? error.message : "Impossible de répondre.");
            endSoon();
        }
    }, [inbound, onConnected, endSoon, acceptCall]);

    const handleReject = useCallback(async () => {
        const callId = inbound?._id;
        reset();
        if (callId) await rejectCall({ callId }).catch(() => undefined);
    }, [inbound?._id, reset, rejectCall]);

    const handleHangUp = useCallback(async () => {
        const callId = currentCallId.current;
        teardownPeer();
        setPhase("ended");
        if (callId) await terminateCall({ callId }).catch(() => undefined);
        setTimeout(reset, 1000);
    }, [reset, terminateCall]);

    const handleToggleMute = useCallback(() => {
        setMuted((prev) => {
            const next = !prev;
            setMicMuted(next);
            return next;
        });
    }, []);

    const handleToggleSpeaker = useCallback(() => {
        setSpeaker((prev) => {
            const next = !prev;
            setSpeakerphone(next);
            return next;
        });
    }, []);

    if (phase === "idle") return null;

    return (
        <CallOverlay
            phase={phase}
            contactName={contactName}
            direction={(displayCall?.direction as "INBOUND" | "OUTBOUND" | undefined) ?? "OUTBOUND"}
            connectedAt={connectedAt}
            muted={muted}
            speaker={speaker}
            onAccept={() => void handleAccept()}
            onReject={() => void handleReject()}
            onHangUp={() => void handleHangUp()}
            onToggleMute={handleToggleMute}
            onToggleSpeaker={handleToggleSpeaker}
        />
    );
}

function reasonLabel(status: string, reason?: string): string {
    if (status === "REJECTED") return "L'appel a été refusé.";
    if (status === "MISSED") return "Appel manqué.";
    if (reason?.includes("credit") || reason?.includes("INSUFFICIENT")) return "Solde insuffisant pour passer l'appel.";
    if (reason?.includes("permission")) return "Le contact n'a pas autorisé les appels.";
    return "L'appel n'a pas pu aboutir.";
}
