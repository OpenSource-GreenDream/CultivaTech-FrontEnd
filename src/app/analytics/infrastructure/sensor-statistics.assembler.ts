import {SensorStatisticsResource} from './sensor-statistics.response';
import {SensorStatistics} from '../domain/model/entity/sensor-statistics.entity';
import {normalizeTelemetryParameter} from '../../monitoring/domain/model/telemetry-parameter';

export class SensorStatisticsAssembler {
  static toEntityFromResource(resource: SensorStatisticsResource): SensorStatistics {
    return {
      deviceId: resource.deviceId,
      parameter: normalizeTelemetryParameter(resource.parameter),
      unit: resource.unit,
      periodStart: resource.periodStart,
      periodEnd: resource.periodEnd,
      sampleCount: resource.sampleCount,
      meanValue: resource.meanValue,
      variance: resource.variance,
      standardDeviation: resource.standardDeviation,
      technicalInterpretation: resource.technicalInterpretation,
    };
  }
}