import {SensorReadingResource} from './sensor-reading-response';
import {SensorReading} from '../domain/model/sensor-reading.entity';
import {isTelemetryParameter, PARAMETER_RANGES, TelemetryParameter} from '../domain/model/telemetry-parameter';

export class SensorReadingAssembler {
  static toEntityFromResource(resource: SensorReadingResource): SensorReading {
    const parameter = isTelemetryParameter(resource.parameter)
      ? resource.parameter
      : TelemetryParameter.MOISTURE;

    return {
      id: resource.id,
      deviceId: resource.device_id,
      parameter,
      value: resource.value,
      unit: resource.unit || PARAMETER_RANGES[parameter].unit,
      recordedAt: resource.recorded_at,
      createdAt: resource.created_at,
    };
  }
}
