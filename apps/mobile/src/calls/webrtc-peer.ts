/**
 * Low-level WebRTC for WhatsApp Business audio calls — the ONLY file that
 * imports `react-native-webrtc` / `react-native-incall-manager`, so the rest of
 * the app (and Expo Go) never loads those native modules. Ported from the web
 * `use-webrtc-call.ts`: a single module-level peer connection, no-trickle SDP
 * (Meta wants a complete SDP), remote audio played by RN-WebRTC automatically.
 */
import {
    RTCPeerConnection,
    RTCSessionDescription,
    mediaDevices,
    type MediaStream,
} from "react-native-webrtc";
import InCallManager from "react-native-incall-manager";

const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
];

export type PeerEvents = {
    onConnected: () => void;
    onClosed: () => void;
};

// One shared session — a call is a single connection across the whole app.
let peer: RTCPeerConnection | null = null;
let localStream: MediaStream | null = null;

async function acquireMic(): Promise<MediaStream> {
    const stream = (await mediaDevices.getUserMedia({ audio: true })) as MediaStream;
    return stream;
}

function buildPeer(stream: MediaStream, events: PeerEvents): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const handle = pc as unknown as { addEventListener: (type: string, cb: () => void) => void };
    handle.addEventListener("iceconnectionstatechange", () => {
        const state = pc.iceConnectionState;
        if (state === "connected" || state === "completed") events.onConnected();
        if (state === "disconnected" || state === "failed" || state === "closed") events.onClosed();
    });
    handle.addEventListener("connectionstatechange", () => {
        const state = (pc as unknown as { connectionState?: string }).connectionState;
        if (state === "failed" || state === "closed") events.onClosed();
    });
    return pc;
}

/** Outbound: acquire mic, create the offer (full SDP after ICE), return it. */
export async function createOutgoingOffer(events: PeerEvents): Promise<string> {
    teardownPeer();
    localStream = await acquireMic();
    peer = buildPeer(localStream, events);
    const offer = await peer.createOffer({});
    await peer.setLocalDescription(offer);
    InCallManager.start({ media: "audio" });
    return waitForIceGathering(peer);
}

/** Inbound: set the remote offer, create the answer (full SDP after ICE), return it. */
export async function createIncomingAnswer(remoteOffer: string, events: PeerEvents): Promise<string> {
    teardownPeer();
    localStream = await acquireMic();
    peer = buildPeer(localStream, events);
    await peer.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: remoteOffer }));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    InCallManager.start({ media: "audio" });
    return waitForIceGathering(peer);
}

/** Outbound: apply Meta's relayed SDP answer once the webhook delivers it. */
export async function applyRemoteAnswer(sdpAnswer: string): Promise<void> {
    if (!peer) return;
    await peer.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: sdpAnswer }));
}

export function setMicMuted(muted: boolean): void {
    localStream?.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
    });
}

export function setSpeakerphone(on: boolean): void {
    try {
        InCallManager.setForceSpeakerphoneOn(on);
    } catch {
        // incall-manager unavailable — earpiece default still works.
    }
}

export function teardownPeer(): void {
    if (peer) {
        try {
            peer.close();
        } catch {
            // already closed
        }
        peer = null;
    }
    if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        localStream = null;
    }
    try {
        InCallManager.stop();
    } catch {
        // not started
    }
}

/** Meta expects a complete SDP (no trickle ICE) — wait for gathering to finish. */
function waitForIceGathering(pc: RTCPeerConnection): Promise<string> {
    return new Promise((resolve) => {
        const sdp = () => pc.localDescription?.sdp ?? "";
        if (pc.iceGatheringState === "complete") {
            resolve(sdp());
            return;
        }
        const timeout = setTimeout(() => resolve(sdp()), 3000);
        const handle = pc as unknown as { addEventListener: (type: string, cb: () => void) => void };
        handle.addEventListener("icegatheringstatechange", () => {
            if (pc.iceGatheringState === "complete") {
                clearTimeout(timeout);
                resolve(sdp());
            }
        });
    });
}
