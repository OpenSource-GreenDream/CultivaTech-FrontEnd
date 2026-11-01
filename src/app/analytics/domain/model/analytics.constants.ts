/**
 * Presentation/domain constants for the Analytics dashboard.
 * Centralised to avoid magic numbers inside stores and templates.
 */

/** Variance above which the aggregate analysis is flagged as an alert. */
export const ANALYTICS_VARIANCE_ALERT_THRESHOLD = 3.0;

/** Maximum tons represented by a full projection comparison bar. */
export const PROJECTION_BAR_MAX_TONS = 50;

/** Maximum width (in percentage points) of a projection comparison bar. */
export const PROJECTION_BAR_MAX_PERCENT = 100;

/** Status values rendered by the analytics indicators card. */
export type AnalyticsStatus = 'OPTIMAL' | 'ALERT' | 'NO_DATA';
