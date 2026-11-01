import {TelemetryParameter} from './telemetry-parameter';

/**
 * Individual sensor reading stored in the `sensor_readings` table.
 */
export interface SensorReading {
  id: number;
  deviceId: number;
  parameter: TelemetryParameter;
  value: number;
  unit: string;
  recordedAt: string;
  createdAt: string;
}
