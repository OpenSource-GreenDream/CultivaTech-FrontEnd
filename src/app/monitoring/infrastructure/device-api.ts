import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {forkJoin, Observable, of} from 'rxjs';
import {map} from 'rxjs';
import {environment} from '../../../environments/environment';
import {DeviceResource} from './device-response';
import {CreateDeviceRequest} from '../domain/model/create-device.request';
import {RegisterDeviceRequest} from './register-device.request';
import {UpdateDeviceRequest} from './update-device.request';

@Service()
export class DeviceApi {
  private readonly http = inject(HttpClient);
  private readonly devicesUrl = `${environment.cultivatechBaseApi}${environment.devicesEndpoint}`;
  private readonly fieldsUrl = `${environment.cultivatechBaseApi}${environment.fieldsEndpoint}`;

  getDevices(): Observable<DeviceResource[]> {
    return this.http.get<DeviceResource[]>(this.devicesUrl);
  }

  getDeviceById(id: number): Observable<DeviceResource> {
    return this.http.get<DeviceResource>(`${this.devicesUrl}/${id}`);
  }

  getDevicesByFieldId(fieldId: number): Observable<DeviceResource[]> {
    return this.http.get<DeviceResource[]>(`${this.fieldsUrl}/${fieldId}/devices`);
  }

  /**
   * Aggregates devices from several fields using the real nested endpoints.
   * Empty input does not trigger any HTTP request.
   */
  getDevicesByFieldIds(fieldIds: number[]): Observable<DeviceResource[]> {
    if (fieldIds.length === 0) {
      return of([]);
    }
    return forkJoin(fieldIds.map((fieldId) => this.getDevicesByFieldId(fieldId))).pipe(
      map((results) => results.flat()),
    );
  }

  createDevice(request: CreateDeviceRequest): Observable<DeviceResource> {
    const payload: RegisterDeviceRequest = {
      macAddress: request.macAddress,
      status: 'ACTIVE',
    };

    return this.http.post<DeviceResource>(
      `${this.fieldsUrl}/${request.fieldId}/devices`,
      payload,
    );
  }

  updateDevice(deviceId: number, request: UpdateDeviceRequest): Observable<DeviceResource> {
    return this.http.put<DeviceResource>(`${this.devicesUrl}/${deviceId}`, request);
  }

  deleteDevice(deviceId: number): Observable<void> {
    return this.http.delete<void>(`${this.devicesUrl}/${deviceId}`);
  }
}