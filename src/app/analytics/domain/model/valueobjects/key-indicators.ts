/**
 * This is a value not persisted in the database
 * It just represents the key indicators of the reports
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
export interface KeyIndicators {
  averageMean: number;
  averageVariance: number;
  averageDeviation: number;
  totalReports: number;
  status: 'Optimal' | 'Alert' | 'No Data';
}
