import { Sensor } from '../domain/model/sensor.entity';
import { SensorResource } from './sensor-resource';

export class SensorAssembler {
  static toEntityFromResource(resource: SensorResource): Sensor {
    return new Sensor(resource.id, resource.code, resource.field_id);
  }
}
