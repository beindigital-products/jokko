/**
 * Formats a timestamp for the conversation list (compact) :
 *   - < 1 min       → "à l'instant"
 *   - same day      → "HH:mm"
 *   - yesterday     → "hier"
 *   - < 7 days      → weekday ("lun", "mar"…)
 *   - older         → "12 mai"
 *
 * `now` is injectable so the function stays pure + testable (no Date.now()
 * captured implicitly).
 */
export function formatListTime(timestamp: number, now: number = Date.now()): string {
    const diff = now - timestamp
    const oneMin = 60_000
    const oneDay = 86_400_000

    if (diff < oneMin) return "à l'instant"

    const d = new Date(timestamp)
    const nowDate = new Date(now)
    const sameDay =
        d.getFullYear() === nowDate.getFullYear() &&
        d.getMonth() === nowDate.getMonth() &&
        d.getDate() === nowDate.getDate()
    if (sameDay) {
        return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    }

    if (diff < 2 * oneDay) return "hier"

    if (diff < 7 * oneDay) {
        return d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "")
    }

    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

/**
 * Formats a timestamp as "HH:mm" for message bubbles.
 */
export function formatBubbleTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
    })
}

/**
 * Day separator label for a thread group ("Aujourd'hui", "Hier", or
 * "lundi 12 mai").
 */
export function formatDaySeparator(timestamp: number, now: number = Date.now()): string {
    const d = new Date(timestamp)
    const nowDate = new Date(now)
    const oneDay = 86_400_000
    const sameDay =
        d.getFullYear() === nowDate.getFullYear() &&
        d.getMonth() === nowDate.getMonth() &&
        d.getDate() === nowDate.getDate()
    if (sameDay) {
        return `Aujourd'hui · ${d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`
    }
    if (now - timestamp < 2 * oneDay) return "Hier"
    return d.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
    })
}
