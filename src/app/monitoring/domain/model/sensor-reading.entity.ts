import {TelemetryParameter} from './telemetry-parameter';

/**
 * Individual sensor reading returned by the Backend.
 * `parameter` is preserved as returned; recognized values are defined by
 * `TelemetryParameter`, but the Backend is not restricted to that set.
 */
export interface SensorReading {
  id: number;
  deviceId: number;
  parameter: string;
  value: number;
  unit: string;
  recordedAt: string;
}
