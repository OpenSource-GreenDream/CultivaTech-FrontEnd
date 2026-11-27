import {AnalyticsReportResource} from './analytics-report-response';
import {AnalyticsReport} from '../domain/model/entity/analytics-report.entity';
import {normalizeTelemetryParameter} from '../../monitoring/domain/model/telemetry-parameter';

export class AnalyticsReportAssembler {
  static toEntityFromResource(resource: AnalyticsReportResource): AnalyticsReport {
    return {
      id: resource.id,
      deviceId: resource.deviceId,
      parameter: normalizeTelemetryParameter(resource.parameter),
      unit: resource.unit,
      periodStart: resource.periodStart,
      periodEnd: resource.periodEnd,
      sampleCount: resource.sampleCount,
      generatedAt: resource.generatedAt,
      meanValue: resource.meanValue,
      variance: resource.variance,
      standardDeviation: resource.standardDeviation,
      technicalInterpretation: resource.technicalInterpretation,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
    };
  }
}