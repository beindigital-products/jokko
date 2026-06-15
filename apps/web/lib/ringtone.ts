/**
 * Incoming-call ringtone, synthesised with the Web Audio API so it needs no
 * asset file. Plays a warm dual-tone ring (~1s) on a ~3s cadence until stopped.
 *
 * Autoplay-safe: it resumes a shared AudioContext; if the browser blocks audio
 * because there has been no user gesture yet, it fails silently — the visual
 * incoming-call dialog (and the browser Notification) still appear.
 */

let audioCtx: AudioContext | null = null;
let cadenceTimer: ReturnType<typeof setInterval> | null = null;
let current: { oscillators: OscillatorNode[]; gain: GainNode } | null = null;

const RING_SECONDS = 1.0; // tone length per burst
const CADENCE_MS = 3000; // ring + silence period

function ringOnce(ctx: AudioContext) {
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    const t0 = ctx.currentTime;
    // Soft attack/release so the tone doesn't click on/off.
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.14, t0 + 0.06);
    gain.gain.setValueAtTime(0.14, t0 + RING_SECONDS - 0.1);
    gain.gain.linearRampToValueAtTime(0, t0 + RING_SECONDS);

    // Warm two-tone ring (440 + 480 Hz).
    const oscillators = [440, 480].map((freq) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(gain);
        osc.start(t0);
        osc.stop(t0 + RING_SECONDS);
        return osc;
    });

    current = { oscillators, gain };
}

/** Start looping the ringtone. No-op if already ringing or if audio is blocked. */
export async function startRingtone(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (cadenceTimer) return; // already ringing

    const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();

    try {
        await audioCtx.resume();
    } catch {
        // Autoplay blocked (no user gesture yet) — stay silent, dialog still shows.
        return;
    }

    ringOnce(audioCtx);
    cadenceTimer = setInterval(() => {
        if (audioCtx) ringOnce(audioCtx);
    }, CADENCE_MS);
}

/** Stop the ringtone immediately and silence any in-flight burst. */
export function stopRingtone(): void {
    if (cadenceTimer) {
        clearInterval(cadenceTimer);
        cadenceTimer = null;
    }
    if (current && audioCtx) {
        try {
            const now = audioCtx.currentTime;
            current.gain.gain.cancelScheduledValues(now);
            current.gain.gain.setValueAtTime(0, now);
            current.oscillators.forEach((osc) => {
                try {
                    osc.stop();
                } catch {
                    /* already stopped */
                }
            });
        } catch {
            /* noop */
        }
    }
    current = null;
}
