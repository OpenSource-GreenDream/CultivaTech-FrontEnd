export interface AnalyticsReport {
  id: number;
  deviceId: number;
  generatedAt: string;
  meanValue: number;
  variance: number;
  standardDeviation: number;
  technicalInterpretation?: string;
  createdAt: string;
  updatedAt: string;
}
