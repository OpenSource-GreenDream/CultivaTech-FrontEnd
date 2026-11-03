import {AnalyticsReportResource} from './analytics-report-response';
import {AnalyticsReport} from '../domain/model/entity/analytics-report.entity';
import {isTelemetryParameter, PARAMETER_RANGES, TelemetryParameter} from '../../monitoring/domain/model/telemetry-parameter';

export class AnalyticsReportAssembler {
  static toEntityFromResource(resource: AnalyticsReportResource): AnalyticsReport {
    const parameter = isTelemetryParameter(resource.parameter)
      ? resource.parameter
      : TelemetryParameter.MOISTURE;

    return {
      id: resource.id,
      deviceId: resource.device_id,
      parameter,
      unit: resource.unit || PARAMETER_RANGES[parameter].unit,
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
