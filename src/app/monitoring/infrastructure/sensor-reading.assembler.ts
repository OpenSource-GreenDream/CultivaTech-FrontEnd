import {SensorReadingResource} from './sensor-reading-response';
import {SensorReading} from '../domain/model/sensor-reading.entity';
import {normalizeTelemetryParameter} from '../domain/model/telemetry-parameter';

export class SensorReadingAssembler {
  static toEntityFromResource(resource: SensorReadingResource): SensorReading {
    return {
      id: resource.id,
      deviceId: resource.deviceId,
      parameter: normalizeTelemetryParameter(resource.parameter),
      value: resource.value,
      unit: resource.unit,
      recordedAt: resource.recordedAt,
    };
  }
}