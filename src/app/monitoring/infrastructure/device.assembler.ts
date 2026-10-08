import {Device} from '../domain/model/device.entity';
import {DeviceResource} from './device-response';

export class DeviceAssembler {
  static toEntityFromResource(resource: DeviceResource): Device {
    return {
      id: resource.id,
      fieldId: resource.field_id,
      macAddress: resource.mac_address,
      status: resource.status,
      lastSync: resource.last_sync,
      createdAt: resource.created_at,
      updatedAt: resource.updated_at,
    };
  }

  static toResourceFromEntity(entity: Device): DeviceResource {
    return {
      id: entity.id,
      field_id: entity.fieldId,
      mac_address: entity.macAddress,
      status: entity.status,
      last_sync: entity.lastSync,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }
}
