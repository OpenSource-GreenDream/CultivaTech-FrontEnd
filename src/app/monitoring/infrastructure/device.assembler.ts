import {Device} from '../domain/model/device.entity';
import {DeviceResource} from './device-response';

export class DeviceAssembler {
  static toEntityFromResource(resource: DeviceResource): Device {
    return {
      id: resource.id,
      fieldId: resource.fieldId,
      macAddress: resource.macAddress,
      status: resource.status,
      lastSync: resource.lastSync,
    };
  }

  static toResourceFromEntity(entity: Device): DeviceResource {
    return {
      id: entity.id,
      fieldId: entity.fieldId,
      macAddress: entity.macAddress,
      status: entity.status,
      lastSync: entity.lastSync,
    };
  }
}