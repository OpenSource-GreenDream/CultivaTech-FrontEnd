export interface HarvestProjectionResource {
  id: number;
  device_id: number;
  crop_type: string;
  projected_yield_tons: number;
  historical_yield_tons: number;
  projection_period: string;
  confidence_score: number;
  created_at: string;
}
