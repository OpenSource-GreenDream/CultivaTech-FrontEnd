import {TelemetryParameter} from '../../../../monitoring/domain/model/telemetry-parameter';

export interface AnalyticsReport {
  id: number;
  deviceId: number;
  parameter: TelemetryParameter;
  unit: string;
  generatedAt: string;
  meanValue: number;
  variance: number;
  standardDeviation: number;
  technicalInterpretation?: string;
  createdAt: string;
  updatedAt: string;
}
