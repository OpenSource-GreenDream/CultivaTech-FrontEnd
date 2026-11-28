export interface KeyIndicators {
  mean: number;
  variance: number;
  standardDeviation: number;
  measurements: number;
  thresholdStatus: import('../analytics.constants').ThresholdStatus;
}