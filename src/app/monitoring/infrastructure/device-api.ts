import {inject, Service} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {DeviceResource} from './device-response';
import {Observable, of} from 'rxjs';
import {CreateDeviceRequest} from '../domain/model/create-device.request';

@Service()
export class DeviceApi{
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.cultivatechBaseApi}${environment.devicesEndpoint}`;

  getDevices(): Observable<DeviceResource[]> {
    return this.http.get<DeviceResource[]>(this.resourceUrl);
  }

  getDevicesByFieldId(fieldId: number): Observable<DeviceResource[]> {
    const params = new HttpParams().set('field_id', fieldId.toString());
    return this.http.get<DeviceResource[]>(this.resourceUrl, { params });
  }

  /**
   * Retrieves the devices of several fields in a single scoped request.
   */
  getDevicesByFieldIds(fieldIds: number[]): Observable<DeviceResource[]> {
    if (fieldIds.length === 0) {
      return of([]);
    }
    let params = new HttpParams();
    for (const fieldId of fieldIds) {
      params = params.append('field_id', fieldId.toString());
    }
    return this.http.get<DeviceResource[]>(this.resourceUrl, { params });
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
