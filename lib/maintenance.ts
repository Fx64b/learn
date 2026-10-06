/**
 * Maintenance mode.
 *
 * Set `MAINTENANCE_MODE=true` in the environment and redeploy to turn it on.
 * Remove the variable (or set it to anything else) and redeploy to turn it off.
 *
 * Effects when on:
 * - Middleware serves `/maintenance` (HTTP 503) for every page request.
 * - Middleware rejects page mutations (server actions) and AI requests with 503.
 * - The root layout shows a banner and a popup that users cannot close.
 * - Stripe webhooks, cron jobs and auth callbacks (all under `/api`) stay active.
 *
 * To remove the feature for good, see the "Maintenance mode" section in README.md.
 */
export function isMaintenanceMode(): boolean {
    return process.env.MAINTENANCE_MODE === 'true'
}
