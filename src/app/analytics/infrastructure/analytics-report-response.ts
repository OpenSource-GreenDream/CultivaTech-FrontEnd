export interface AnalyticsReportResource {
  id: number;
  device_id: number;
  parameter?: string;
  unit?: string;
  generated_at: string;
  mean_value: number;
  variance: number;
  standard_deviation: number;
  technical_interpretation: string;
  created_at: string;
  updated_at: string;
}
