export interface HarvestProjection {
  id: number;
  deviceId: number;
  cropType: string;
  projectedYieldTons: number;
  historicalYieldTons: number;
  projectionPeriod: string;
  confidenceScore: number;
  createdAt: string;
}
