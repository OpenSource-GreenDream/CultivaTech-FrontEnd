export interface SensorReadingResource {
  id: number;
  deviceId: number;
  parameter: string;
  value: number;
  unit: string;
  recordedAt: string;
}