export interface AnalyticsReportResource {
  id: number;
  deviceId: number;
  parameter: string;
  unit: string;
  periodStart: string;
  periodEnd: string;
  sampleCount: number;
  generatedAt: string;
  meanValue: number;
  variance: number;
  standardDeviation: number;
  technicalInterpretation: string;
  createdAt: string;
  updatedAt: string;
}