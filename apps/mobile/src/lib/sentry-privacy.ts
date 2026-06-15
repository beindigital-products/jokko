import {
    scrubBreadcrumb,
    scrubPii,
    type SentryBreadcrumb,
    type SentryEvent,
} from "./pii-scrubber";

export type SentryPrivacyConfig = {
    dsn?: string;
    enabled: boolean;
    environment?: string;
    release?: string;
    sendDefaultPii: false;
    attachStacktrace: true;
    tracesSampleRate: number;
    beforeSend: (event: SentryEvent) => SentryEvent | null;
    beforeBreadcrumb: (breadcrumb: SentryBreadcrumb | null) => SentryBreadcrumb | null;
};

export type CreateSentryPrivacyConfigArgs = {
    dsn?: string;
    enabled?: boolean;
    environment?: string;
    release?: string;
    tracesSampleRate?: number;
};

/**
 * Production Sentry privacy baseline.
 *
 * This object is intentionally dependency-free for S6: L1 can pass it directly
 * to `Sentry.init(buildSentryPrivacyConfig(...))` after installing
 * `@sentry/react-native`.
 */
export function buildSentryPrivacyConfig(
    args: CreateSentryPrivacyConfigArgs = {},
): SentryPrivacyConfig {
    return {
        dsn: args.dsn,
        enabled: args.enabled ?? Boolean(args.dsn),
        environment: args.environment,
        release: args.release,
        sendDefaultPii: false,
        attachStacktrace: true,
        tracesSampleRate: args.tracesSampleRate ?? 0.05,
        beforeSend: scrubPii,
        beforeBreadcrumb: scrubBreadcrumb,
    };
}
