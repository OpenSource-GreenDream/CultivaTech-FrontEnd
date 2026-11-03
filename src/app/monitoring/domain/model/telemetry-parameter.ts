/**
 * Telemetry parameters registered by the IoT sensors (see `docs/database.md`).
 */
export enum TelemetryParameter {
  MOISTURE = 'MOISTURE',
  TEMPERATURE = 'TEMPERATURE',
  NUTRIENTS = 'NUTRIENTS',
  PH = 'PH',
}

export interface ParameterRange {
  min: number;
  max: number;
  unit: string;
}

/**
 * Domain ranges used to evaluate parameters that have no profile-level threshold.
 * Percentages are expressed in percentage points (25.5 = 25.5 %).
 */
export const PARAMETER_RANGES: Record<TelemetryParameter, ParameterRange> = {
  [TelemetryParameter.MOISTURE]: { min: 0, max: 100, unit: '%' },
  [TelemetryParameter.TEMPERATURE]: { min: -10, max: 60, unit: '°C' },
  [TelemetryParameter.NUTRIENTS]: { min: 20, max: 80, unit: 'ppm' },
  [TelemetryParameter.PH]: { min: 5.5, max: 7.5, unit: 'pH' },
};

export const PARAMETER_I18N_KEYS: Record<TelemetryParameter, string> = {
  [TelemetryParameter.MOISTURE]: 'monitoring.parameters.moisture',
  [TelemetryParameter.TEMPERATURE]: 'monitoring.parameters.temperature',
  [TelemetryParameter.NUTRIENTS]: 'monitoring.parameters.nutrients',
  [TelemetryParameter.PH]: 'monitoring.parameters.ph',
};

/**
 * Parameter-agnostic evaluation result shared by monitoring and analytics.
 */
export type TelemetryStatus = 'LOW_MOISTURE' | 'OUT_OF_RANGE' | 'OPTIMAL';

/**
 * Profile-level thresholds available for telemetry evaluation.
 */
export interface ParameterThresholds {
  moisture: number | null;
  temperature: number | null;
}

export function isTelemetryParameter(value: string | null | undefined): value is TelemetryParameter {
  if (!value) return false;
  return Object.values(TelemetryParameter).includes(value as TelemetryParameter);
}

/**
 * Evaluates a parameter reading against its own threshold/range.
 * Moisture is a lower bound, temperature an upper bound and the remaining
 * parameters are validated against their full agronomic range.
 */
export function evaluateTelemetryStatus(
  parameter: TelemetryParameter | null | undefined,
  value: number,
  thresholds: ParameterThresholds,
): TelemetryStatus {
  if (!parameter || !Number.isFinite(value)) {
    return 'OPTIMAL';
  }

  switch (parameter) {
    case TelemetryParameter.MOISTURE:
      return thresholds.moisture !== null && value < thresholds.moisture
        ? 'LOW_MOISTURE'
        : 'OPTIMAL';
    case TelemetryParameter.TEMPERATURE:
      return thresholds.temperature !== null && value > thresholds.temperature
        ? 'OUT_OF_RANGE'
        : 'OPTIMAL';
    case TelemetryParameter.NUTRIENTS:
    case TelemetryParameter.PH: {
      const range = PARAMETER_RANGES[parameter];
      return value < range.min || value > range.max ? 'OUT_OF_RANGE' : 'OPTIMAL';
    }
    default:
      return 'OPTIMAL';
  }
}

/**
 * Resolves the relevant bound for the parameter, falling back to the
 * domain range when the profile does not define a threshold.
 */
export function resolveParameterThreshold(
  parameter: TelemetryParameter,
  thresholds: ParameterThresholds,
): number {
  switch (parameter) {
    case TelemetryParameter.MOISTURE:
      return thresholds.moisture ?? PARAMETER_RANGES[TelemetryParameter.MOISTURE].min;
    case TelemetryParameter.TEMPERATURE:
      return thresholds.temperature ?? PARAMETER_RANGES[TelemetryParameter.TEMPERATURE].max;
    case TelemetryParameter.NUTRIENTS:
      return PARAMETER_RANGES[TelemetryParameter.NUTRIENTS].max;
    case TelemetryParameter.PH:
      return PARAMETER_RANGES[TelemetryParameter.PH].min;
    default:
      return PARAMETER_RANGES[TelemetryParameter.MOISTURE].min;
  }
}
