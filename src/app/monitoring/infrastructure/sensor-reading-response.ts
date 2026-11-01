export interface SensorReadingResource {
  id: number;
  device_id: number;
  parameter: string;
  value: number;
  unit: string;
  recorded_at: string;
  created_at: string;
}
