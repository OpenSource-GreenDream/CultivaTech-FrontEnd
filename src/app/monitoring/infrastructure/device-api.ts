import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {DeviceResource} from './device-response';
import {Observable} from 'rxjs';
import {CreateDeviceRequest} from '../domain/model/create-device.request';

@Service()
export class DeviceApi{
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.cultivatechBaseApi}/devices`;

  getDevices(): Observable<DeviceResource[]> {
    return this.http.get<DeviceResource[]>(this.resourceUrl);
  }

  getDeviceById(id: number): Observable<DeviceResource> {
    return this.http.get<DeviceResource>(`${this.resourceUrl}/${id}`);
  }

  createDevice(request: CreateDeviceRequest): Observable<DeviceResource> {
    const payload = {
      field_id: request.fieldId,
      mac_address: request.macAddress,
      status: 'ACTIVE',
      last_sync: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return this.http.post<DeviceResource>(this.resourceUrl, payload);
  }
}
