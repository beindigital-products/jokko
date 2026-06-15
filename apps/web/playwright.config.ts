import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const AUTH_FILE = path.join(__dirname, 'e2e', '.auth', 'user.json');

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    // Cap local workers: the suite shares one dev server + Convex backend, so the
    // default (~cpu/2) can saturate it and cause cascading timeouts. CI uses 1.
    workers: process.env.CI ? 1 : 4,
    reporter: 'html',
    use: {
        baseURL: 'https://localhost:1000',
        ignoreHTTPSErrors: true,
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'setup',
            testMatch: /auth\.setup\.ts/,
        },
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                storageState: AUTH_FILE,
                // Fake mic so the voice-message flow (getUserMedia → record →
                // send) can run headless; auto-accept the permission prompt.
                permissions: ['microphone'],
                launchOptions: {
                    args: [
                        '--use-fake-ui-for-media-stream',
                        '--use-fake-device-for-media-stream',
                    ],
                },
            },
            dependencies: ['setup'],
        },
    ],
    webServer: {
        command: 'pnpm dev',
        url: 'https://localhost:1000',
        reuseExistingServer: true,
        ignoreHTTPSErrors: true,
    },
});
