export enum TelemetryParameter {
  MOISTURE = 'MOISTURE',
  PH = 'PH',
  NITROGEN = 'NITROGEN',
  PHOSPHORUS = 'PHOSPHORUS',
  POTASSIUM = 'POTASSIUM',
  CALCIUM = 'CALCIUM',
  MAGNESIUM = 'MAGNESIUM',
  SULFUR = 'SULFUR',
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
  [TelemetryParameter.PH]: { min: 5.5, max: 7.5, unit: 'unitless' },
  [TelemetryParameter.NITROGEN]: { min: 0, max: 1000, unit: 'mg/kg' },
  [TelemetryParameter.PHOSPHORUS]: { min: 0, max: 1000, unit: 'mg/kg' },
  [TelemetryParameter.POTASSIUM]: { min: 0, max: 1000, unit: 'mg/kg' },
  [TelemetryParameter.CALCIUM]: { min: 0, max: 1000, unit: 'mg/kg' },
  [TelemetryParameter.MAGNESIUM]: { min: 0, max: 1000, unit: 'mg/kg' },
  [TelemetryParameter.SULFUR]: { min: 0, max: 1000, unit: 'mg/kg' },
};

export const PARAMETER_I18N_KEYS: Record<TelemetryParameter, string> = {
  [TelemetryParameter.MOISTURE]: 'monitoring.parameters.moisture',
  [TelemetryParameter.PH]: 'monitoring.parameters.ph',
  [TelemetryParameter.NITROGEN]: 'monitoring.parameters.nitrogen',
  [TelemetryParameter.PHOSPHORUS]: 'monitoring.parameters.phosphorus',
  [TelemetryParameter.POTASSIUM]: 'monitoring.parameters.potassium',
  [TelemetryParameter.CALCIUM]: 'monitoring.parameters.calcium',
  [TelemetryParameter.MAGNESIUM]: 'monitoring.parameters.magnesium',
  [TelemetryParameter.SULFUR]: 'monitoring.parameters.sulfur',
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

export function normalizeTelemetryParameter(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
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
    case TelemetryParameter.PH:
    case TelemetryParameter.NITROGEN:
    case TelemetryParameter.PHOSPHORUS:
    case TelemetryParameter.POTASSIUM:
    case TelemetryParameter.CALCIUM:
    case TelemetryParameter.MAGNESIUM:
    case TelemetryParameter.SULFUR: {
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
    case TelemetryParameter.PH:
      return PARAMETER_RANGES[TelemetryParameter.PH].min;
    default:
      return PARAMETER_RANGES[parameter].min;
  }
}
