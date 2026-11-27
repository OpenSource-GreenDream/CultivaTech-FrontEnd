export interface SensorStatistics {
  deviceId: number;
  parameter: string;
  unit: string;
  periodStart: string;
  periodEnd: string;
  sampleCount: number;
  meanValue: number;
  variance: number;
  standardDeviation: number;
  technicalInterpretation: string;
}