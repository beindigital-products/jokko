export const FIRST_LAUNCH_SEEN_STORAGE_KEY = "jokko.global.firstLaunchSeen.v1";

export function parseFirstLaunchSeen(raw: string | null | undefined): boolean {
    return raw === "true";
}

export function serializeFirstLaunchSeen(seen: boolean): string {
    return seen ? "true" : "false";
}
