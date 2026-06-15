'use client';

import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useCallStore } from '@/lib/stores/call-store';
import type { Id } from '@/convex/_generated/dataModel';

/**
 * Browser-side RTCPeerConnection manager for WhatsApp Business calls.
 *
 * The peer connection, mic stream and remote-audio element are MODULE-LEVEL
 * singletons — not per-hook refs. A call is a single shared session, but this
 * hook is mounted in several components at once: the provider that PLACES the
 * outbound call, the ActiveCallBar that CONTROLS it (mute/hang-up), and the
 * IncomingCallDialog that ANSWERS inbound calls. Per-instance refs gave each
 * component its own dead RTCPeerConnection, so on outbound calls the remote
 * audio never reached the bar's <audio> element (silence) and mute/hang-up
 * acted on an empty connection. One shared connection fixes all of that, and
 * the remote audio plays through a single programmatic Audio() element so it
 * no longer depends on which component rendered a <audio ref>.
 *
 * Flow (inbound): Meta SDP offer (webhook) -> Convex -> Accept -> answer ->
 *   pre_accept -> ICE connected -> confirmConnected (accept) -> audio.
 * Flow (outbound): CPR/permission -> offer -> startOutboundCall -> Meta ->
 *   SDP answer (webhook) -> applyRemoteSdpAnswer -> ICE connected -> audio.
 */

let peerConnection: RTCPeerConnection | null = null;
let localStream: MediaStream | null = null;
let remoteAudio: HTMLAudioElement | null = null;

const ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
];

/** Play Meta's relayed remote audio through a single shared Audio() element. */
function attachRemoteStream(stream: MediaStream) {
    if (typeof window === 'undefined') return;
    if (!remoteAudio) {
        remoteAudio = new Audio();
        remoteAudio.autoplay = true;
    }
    remoteAudio.srcObject = stream;
    // getUserMedia was already granted in this session, so autoplaying the
    // remote audio is permitted; still catch to avoid an unhandled rejection.
    remoteAudio.play().catch((err) => console.warn('[WebRTC] remote audio play() blocked:', err));
}

/** Tear down the shared peer connection, mic stream and remote audio element. */
function teardownPeer() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
        localStream = null;
    }
    if (remoteAudio) {
        remoteAudio.pause();
        remoteAudio.srcObject = null;
        remoteAudio = null;
    }
}

export function useWebRTCCall() {
    const { setCallState, toggleMute: storeToggleMute, isMuted, clearCall, setMicStream } = useCallStore();

    const acceptCallMutation = useMutation(api.calls.acceptCall);
    const confirmConnectedMutation = useMutation(api.calls.confirmConnected);
    const terminateCallMutation = useMutation(api.calls.terminateCall);
    const startOutboundCallMutation = useMutation(api.calls.startOutboundCall);

    // ---- INBOUND: Answer an incoming call ----
    const answerCall = useCallback(async (callId: Id<"calls">, sdpOffer: string) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            teardownPeer(); // drop any stale connection from a previous call
            localStream = stream;

            const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
            peerConnection = pc;

            stream.getTracks().forEach((track) => pc.addTrack(track, stream));

            pc.ontrack = (event) => {
                if (event.streams[0]) attachRemoteStream(event.streams[0]);
            };

            await pc.setRemoteDescription({ type: 'offer', sdp: sdpOffer });

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            const sdpAnswer = await waitForIceGathering(pc);

            await acceptCallMutation({ callId, sdpAnswer });

            setCallState('connecting');

            pc.oniceconnectionstatechange = () => {
                const state = pc.iceConnectionState;
                if (state === 'connected' || state === 'completed') {
                    setCallState('connected');
                    confirmConnectedMutation({ callId });
                }
                if (state === 'disconnected' || state === 'failed' || state === 'closed') {
                    teardownPeer();
                    setCallState('ended');
                }
            };

            pc.onconnectionstatechange = () => {
                if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                    teardownPeer();
                    setCallState('ended');
                }
            };
        } catch (error) {
            console.error('[WebRTC] Failed to answer call:', error);
            teardownPeer();
            setCallState('ended');
            throw error;
        }
    }, [acceptCallMutation, confirmConnectedMutation, setCallState]);

    // ---- OUTBOUND: Initiate a call after permission granted ----
    const initiateCall = useCallback(async (callId: Id<"calls">) => {
        try {
            setCallState('dialing');
            console.log('[call-flow] initiateCall: state -> dialing, callId:', callId);

            // Reuse the pre-acquired stream stored during the click handler.
            // This avoids calling getUserMedia from inside a useEffect (non-user-gesture
            // context) which would fail with NotAllowedError on non-HTTPS origins.
            let stream: MediaStream;
            const storedStream = useCallStore.getState().micStream;
            if (storedStream && storedStream.active) {
                console.log('[call-flow] initiateCall: reusing pre-acquired mic stream from store');
                stream = storedStream;
                // Clear the store reference so we own the stream exclusively.
                setMicStream(null);
            } else {
                // Fallback: attempt getUserMedia (works on HTTPS or if already granted).
                console.log('[call-flow] initiateCall: no stored stream, calling getUserMedia');
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    console.log('[call-flow] initiateCall: getUserMedia succeeded');
                } catch (micErr) {
                    const e = micErr as DOMException;
                    const permState = await navigator.permissions
                        .query({ name: 'microphone' as PermissionName })
                        .then((s) => s.state)
                        .catch(() => 'unavailable');
                    console.error('[call-flow] initiateCall: getUserMedia failed', {
                        name: e.name,
                        message: e.message,
                        permissionState: permState,
                    });
                    throw micErr;
                }
            }
            teardownPeer(); // drop any stale connection from a previous call
            localStream = stream;

            const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
            peerConnection = pc;

            stream.getTracks().forEach((track) => pc.addTrack(track, stream));

            pc.ontrack = (event) => {
                if (event.streams[0]) attachRemoteStream(event.streams[0]);
            };

            // Create offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            const sdpOffer = await waitForIceGathering(pc);

            // Send to Convex -> Meta
            await startOutboundCallMutation({ callId, sdpOffer });

            // Monitor connection state
            pc.oniceconnectionstatechange = () => {
                const state = pc.iceConnectionState;
                if (state === 'connected' || state === 'completed') {
                    setCallState('connected');
                    confirmConnectedMutation({ callId });
                }
                if (state === 'disconnected' || state === 'failed' || state === 'closed') {
                    teardownPeer();
                    // Don't override error state set by the provider
                    const currentState = useCallStore.getState().callState;
                    if (currentState !== 'error') {
                        setCallState('ended');
                    }
                }
            };

            pc.onconnectionstatechange = () => {
                if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                    teardownPeer();
                    const currentState = useCallStore.getState().callState;
                    if (currentState !== 'error') {
                        setCallState('ended');
                    }
                }
            };
        } catch (error) {
            console.error('[WebRTC] Failed to initiate outbound call:', error);
            teardownPeer();
            // Don't override error state set by the provider
            const currentState = useCallStore.getState().callState;
            if (currentState !== 'error') {
                setCallState('ended');
            }
            throw error;
        }
    }, [startOutboundCallMutation, confirmConnectedMutation, setCallState, setMicStream]);

    // ---- Apply remote SDP answer (for outbound calls) ----
    const applyRemoteSdpAnswer = useCallback(async (sdpAnswer: string) => {
        const pc = peerConnection;
        if (!pc) {
            console.error('[WebRTC] No peer connection for remote SDP answer');
            return;
        }
        try {
            await pc.setRemoteDescription({ type: 'answer', sdp: sdpAnswer });
            console.log('[WebRTC] Remote SDP answer applied');
        } catch (error) {
            console.error('[WebRTC] Failed to apply remote SDP answer:', error);
        }
    }, []);

    const hangUp = useCallback(async (callId: Id<"calls">) => {
        teardownPeer();
        setCallState('ended');

        try {
            await terminateCallMutation({ callId });
        } catch (error) {
            console.error('[WebRTC] Failed to terminate call:', error);
        }

        setTimeout(() => clearCall(), 1500);
    }, [terminateCallMutation, setCallState, clearCall]);

    const toggleMute = useCallback(() => {
        if (localStream) {
            localStream.getAudioTracks().forEach((track) => {
                track.enabled = !track.enabled;
            });
        }
        storeToggleMute();
    }, [storeToggleMute]);

    return {
        answerCall,
        initiateCall,
        applyRemoteSdpAnswer,
        hangUp,
        toggleMute,
        isMuted,
    };
}

/**
 * Waits for ICE gathering to complete and returns the final SDP.
 * Meta expects a complete SDP (no trickle ICE).
 */
function waitForIceGathering(pc: RTCPeerConnection): Promise<string> {
    return new Promise((resolve) => {
        if (pc.iceGatheringState === 'complete') {
            resolve(pc.localDescription!.sdp);
            return;
        }

        const timeout = setTimeout(() => {
            resolve(pc.localDescription!.sdp);
        }, 3000);

        pc.onicegatheringstatechange = () => {
            if (pc.iceGatheringState === 'complete') {
                clearTimeout(timeout);
                resolve(pc.localDescription!.sdp);
            }
        };
    });
}
