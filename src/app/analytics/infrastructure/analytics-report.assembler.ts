import {AnalyticsReportResource} from './analytics-report-response';
import {AnalyticsReport} from '../domain/model/entity/analytics-report';
import {Service} from '@angular/core';

@Service()
export class AnalyticsReportAssembler {
  static toEntityFromResource(resource: AnalyticsReportResource): AnalyticsReport {
    return {
      id: resource.id,
      deviceId: resource.device_id,
      generatedAt: resource.generated_at,
      meanValue: resource.mean_value,
      variance: resource.variance,
      standardDeviation: resource.standard_deviation,
      technicalInterpretation: resource.technical_interpretation,
      createdAt: resource.created_at,
      updatedAt: resource.updated_at
    };
  }
}
